const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createDonor = async (data) => {
  const { fullName, name, phone, contact, email, address } = data;

  const donorName = fullName || name;
  const donorPhone = phone || contact || null;

  if (!donorName || !donorName.trim()) {
    throw new ApiError(400, "Donor name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO donors (full_name, phone, email, address)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      donorName.trim(),
      donorPhone,
      email || null,
      address || null,
    ]
  );

  return result.rows[0];
};

const findOrCreateDonorForDonation = async (client, data) => {
  const donorId = data.donorId || data.donor_id || null;
  const donorName = data.name?.trim() || data.fullName?.trim();
  const donorContact = data.contact || data.cont || data.phone || null;
  const donorEmail = data.email || null;
  const donorAddress = data.address || null;

  if (donorId) {
    const donorResult = await client.query(
      `
      SELECT id
      FROM donors
      WHERE id = $1
      `,
      [donorId]
    );

    if (donorResult.rows.length === 0) {
      throw new ApiError(404, "Donor not found");
    }

    if (donorName || donorContact) {
      await client.query(
        `
        UPDATE donors
        SET
          full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone)
        WHERE id = $3
        `,
        [donorName || null, donorContact || null, donorId]
      );
    }

    return donorResult.rows[0].id;
  }

  if (!donorName) {
    throw new ApiError(400, "Donor name is required");
  }

  if (donorContact) {
    const existingDonor = await client.query(
      `
      SELECT id
      FROM donors
      WHERE phone = $1
      LIMIT 1
      `,
      [donorContact]
    );

    if (existingDonor.rows.length > 0) {
      await client.query(
        `
        UPDATE donors
        SET full_name = COALESCE($1, full_name)
        WHERE id = $2
        `,
        [donorName || null, existingDonor.rows[0].id]
      );

      return existingDonor.rows[0].id;
    }
  }

  const donorResult = await client.query(
    `
    INSERT INTO donors (full_name, phone, email, address)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
    [donorName, donorContact, donorEmail, donorAddress]
  );

  return donorResult.rows[0].id;
};

const resolveDonationMethodId = async (client, data) => {
  const method = data.method;
  let finalMethodId = data.donationMethodId || data.methodId || null;

  if (!finalMethodId && method) {
    const methodResult = await client.query(
      `
      SELECT id
      FROM donation_methods
      WHERE LOWER(method_name) = LOWER($1)
      LIMIT 1
      `,
      [method]
    );

    if (methodResult.rows.length > 0) {
      finalMethodId = methodResult.rows[0].id;
    } else {
      const newMethodResult = await client.query(
        `
        INSERT INTO donation_methods (method_name)
        VALUES ($1)
        RETURNING id
        `,
        [method]
      );

      finalMethodId = newMethodResult.rows[0].id;
    }
  }

  if (!finalMethodId) {
    throw new ApiError(400, "Donation method is required");
  }

  return finalMethodId;
};

const createDonation = async (data, currentUser) => {
  const finalAmount = Number(data.amount);
  const finalDate = data.date || data.donationDate || new Date();

  if (!finalAmount || finalAmount <= 0) {
    throw new ApiError(400, "Donation amount must be greater than zero");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const donorId = await findOrCreateDonorForDonation(client, data);
    const finalMethodId = await resolveDonationMethodId(client, data);

    const result = await client.query(
      `
      INSERT INTO donations
      (
        donor_id,
        donation_method_id,
        amount,
        donation_date,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        donorId,
        finalMethodId,
        finalAmount,
        finalDate,
        currentUser.id,
      ]
    );

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "CREATE_DONATION",
        "welfare",
        `Created donation amount ${finalAmount} for donor ID ${donorId}`,
      ]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getDonors = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = query.search || "";

  const result = await pool.query(
    `
    SELECT id, full_name, phone, email, address, created_at
    FROM donors
    WHERE 
      full_name ILIKE $1
      OR phone ILIKE $1
      OR email ILIKE $1
    ORDER BY id DESC
    LIMIT $2 OFFSET $3
    `,
    [`%${search}%`, limit, offset]
  );

  return result.rows;
};

const getDonorById = async (id) => {
  const result = await pool.query(
    `
    SELECT id, full_name, phone, email, address, created_at
    FROM donors
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Donor not found");
  }

  return result.rows[0];
};

const updateDonor = async (id, data) => {
  await getDonorById(id);

  const { fullName, phone, email, address } = data;

  if (!fullName) {
    throw new ApiError(400, "Donor name is required");
  }

  const result = await pool.query(
    `
    UPDATE donors
    SET
      full_name = $1,
      phone = $2,
      email = $3,
      address = $4
    WHERE id = $5
    RETURNING *
    `,
    [fullName, phone || null, email || null, address || null, id]
  );

  return result.rows[0];
};

const deleteDonor = async (id) => {
  await getDonorById(id);

  const donationCheck = await pool.query(
    `
    SELECT COUNT(*) AS total_donations
    FROM donations
    WHERE donor_id = $1
    `,
    [id]
  );

  const totalDonations = Number(donationCheck.rows[0].total_donations);

  if (totalDonations > 0) {
    throw new ApiError(
      400,
      "This donor has donation records. You cannot delete this donor."
    );
  }

  const result = await pool.query(
    `
    DELETE FROM donors
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  return result.rows[0];
};

const findOrCreateCharityProfile = async (client, data, currentUser) => {
  const {
    charityId,
    charityName,
    fullName,
    fatherName,
    contactPerson,
    phone,
    cnic,
    address,
    familyMembers,
    monthlyIncome,
    description,
  } = data;

  if (charityId) {
    const profileResult = await client.query(
      `
      SELECT id
      FROM charities
      WHERE id = $1
      `,
      [charityId]
    );

    if (profileResult.rows.length === 0) {
      throw new ApiError(404, "Charity profile not found");
    }

    return profileResult.rows[0].id;
  }

  const personName = charityName || fullName;

  if (!personName || !personName.trim()) {
    throw new ApiError(400, "Person name is required");
  }

  if (cnic) {
    const existingByCnic = await client.query(
      `
      SELECT id
      FROM charities
      WHERE cnic = $1
      LIMIT 1
      `,
      [cnic]
    );

    if (existingByCnic.rows.length > 0) {
      return existingByCnic.rows[0].id;
    }
  }

  if (phone) {
    const existingByPhone = await client.query(
      `
      SELECT id
      FROM charities
      WHERE phone = $1
      LIMIT 1
      `,
      [phone]
    );

    if (existingByPhone.rows.length > 0) {
      return existingByPhone.rows[0].id;
    }
  }

  const result = await client.query(
    `
    INSERT INTO charities
    (
      charity_name,
      charity_type,
      contact_person,
      father_name,
      phone,
      cnic,
      address,
      description,
      family_members,
      monthly_income,
      is_active,
      created_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11)
    RETURNING id
    `,
    [
      personName.trim(),
      data.charityType || null,
      contactPerson || null,
      fatherName || null,
      phone || null,
      cnic || null,
      address || null,
      description || null,
      Number(familyMembers || 0),
      Number(monthlyIncome || 0),
      currentUser.id,
    ]
  );

  return result.rows[0].id;
};

const createCharity = async (data, currentUser) => {
  const {
    charityType,
    amount,
    itemName,
    quantity,
    charityDate,
    date,
    recordNote,
    note,
  } = data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const charityId = await findOrCreateCharityProfile(
      client,
      data,
      currentUser
    );

    const recordResult = await client.query(
      `
      INSERT INTO charity_records
      (
        charity_id,
        charity_type,
        amount,
        item_name,
        quantity,
        charity_date,
        note,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        charityId,
        charityType || null,
        Number(amount || 0),
        itemName || null,
        Number(quantity || 0),
        charityDate || date || new Date(),
        recordNote || note || null,
        currentUser.id,
      ]
    );

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "CREATE_CHARITY",
        "welfare",
        `Created charity profile/record ID ${charityId}`,
      ]
    );

    await client.query("COMMIT");

    return recordResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getCharities = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = query.search || "";

  const result = await pool.query(
    `
    SELECT
      c.id,
      c.charity_name,
      c.charity_name AS full_name,
      c.charity_type,
      c.contact_person,
      c.father_name,
      c.phone,
      c.cnic,
      c.address,
      c.description,
      c.family_members,
      c.monthly_income,
      c.is_active,
      c.created_at,

      COALESCE(COUNT(cr.id), 0) AS total_records,
      COALESCE(SUM(cr.amount), 0) AS total_amount,
      MAX(cr.charity_date) AS last_charity_date,

      (
        SELECT cr2.charity_type
        FROM charity_records cr2
        WHERE cr2.charity_id = c.id
        ORDER BY cr2.charity_date DESC, cr2.id DESC
        LIMIT 1
      ) AS last_charity_type

    FROM charities c
    LEFT JOIN charity_records cr ON cr.charity_id = c.id
    WHERE 
      c.charity_name ILIKE $1
      OR c.contact_person ILIKE $1
      OR c.father_name ILIKE $1
      OR c.phone ILIKE $1
      OR c.cnic ILIKE $1
    GROUP BY c.id
    ORDER BY c.id DESC
    LIMIT $2 OFFSET $3
    `,
    [`%${search}%`, limit, offset]
  );

  return result.rows;
};

const getCharityById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.charity_name,
      c.charity_name AS full_name,
      c.charity_type,
      c.contact_person,
      c.father_name,
      c.phone,
      c.cnic,
      c.address,
      c.description,
      c.family_members,
      c.monthly_income,
      c.is_active,
      c.created_at,

      COALESCE(COUNT(cr.id), 0) AS total_records,
      COALESCE(SUM(cr.amount), 0) AS total_amount,
      MAX(cr.charity_date) AS last_charity_date

    FROM charities c
    LEFT JOIN charity_records cr ON cr.charity_id = c.id
    WHERE c.id = $1
    GROUP BY c.id
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Charity profile not found");
  }

  return result.rows[0];
};

const updateCharity = async (id, data, currentUser) => {
  await getCharityById(id);

  const {
    charityName,
    fullName,
    charityType,
    contactPerson,
    fatherName,
    phone,
    cnic,
    address,
    description,
    familyMembers,
    monthlyIncome,
  } = data;

  const personName = charityName || fullName;

  if (!personName || !personName.trim()) {
    throw new ApiError(400, "Person name is required");
  }

  const result = await pool.query(
    `
    UPDATE charities
    SET
      charity_name = $1,
      charity_type = $2,
      contact_person = $3,
      father_name = $4,
      phone = $5,
      cnic = $6,
      address = $7,
      description = $8,
      family_members = $9,
      monthly_income = $10,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
    RETURNING *
    `,
    [
      personName.trim(),
      charityType || null,
      contactPerson || null,
      fatherName || null,
      phone || null,
      cnic || null,
      address || null,
      description || null,
      Number(familyMembers || 0),
      Number(monthlyIncome || 0),
      id,
    ]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "UPDATE_CHARITY_PROFILE",
      "welfare",
      `Updated charity profile ID ${id}`,
    ]
  );

  return result.rows[0];
};

const deleteCharity = async (id, currentUser) => {
  const charity = await getCharityById(id);

  const result = await pool.query(
    `
    DELETE FROM charities
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "DELETE_CHARITY_PROFILE",
      "welfare",
      `Deleted charity profile ${charity.charity_name}`,
    ]
  );

  return result.rows[0];
};

const getCharityHistory = async (charityId) => {
  await getCharityById(charityId);

  const result = await pool.query(
    `
    SELECT
      cr.id,
      cr.charity_id,
      cr.charity_type,
      cr.amount,
      cr.item_name,
      cr.quantity,
      cr.charity_date,
      cr.note,
      cr.created_at,
      u.full_name AS created_by_name
    FROM charity_records cr
    LEFT JOIN users u ON u.id = cr.created_by
    WHERE cr.charity_id = $1
    ORDER BY cr.charity_date DESC, cr.id DESC
    `,
    [charityId]
  );

  return result.rows;
};

const createCharityForProfile = async (charityId, data, currentUser) => {
  await getCharityById(charityId);

  const result = await pool.query(
    `
    INSERT INTO charity_records
    (
      charity_id,
      charity_type,
      amount,
      item_name,
      quantity,
      charity_date,
      note,
      created_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    `,
    [
      charityId,
      data.charityType || null,
      Number(data.amount || 0),
      data.itemName || null,
      Number(data.quantity || 0),
      data.charityDate || data.date || new Date(),
      data.note || null,
      currentUser.id,
    ]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "CREATE_CHARITY_RECORD",
      "welfare",
      `Added charity record for charity profile ID ${charityId}`,
    ]
  );

  return result.rows[0];
};

const getAllCharityRecords = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 100;
  const offset = (page - 1) * limit;

  const search = query.search || "";
  const fromDate = query.fromDate || null;
  const toDate = query.toDate || null;
  const charityType = query.charityType || null;

  const result = await pool.query(
    `
    SELECT
      cr.id,
      cr.charity_id,
      cr.charity_type,
      cr.amount,
      cr.item_name,
      cr.quantity,
      cr.charity_date,
      cr.note,
      cr.created_at,

      c.charity_name AS beneficiary_name,
      c.phone AS beneficiary_phone,
      c.cnic AS beneficiary_cnic,

      u.full_name AS created_by_name
    FROM charity_records cr
    LEFT JOIN charities c ON c.id = cr.charity_id
    LEFT JOIN users u ON u.id = cr.created_by
WHERE
  ($1::DATE IS NULL OR cr.charity_date >= $1)
  AND ($2::DATE IS NULL OR cr.charity_date <= $2)
  AND ($3::VARCHAR IS NULL OR cr.charity_type = $3)
  AND (
    c.charity_name ILIKE $4
    OR c.phone ILIKE $4
    OR c.cnic ILIKE $4
    OR cr.charity_type ILIKE $4
  )
ORDER BY cr.charity_date DESC, cr.id DESC
LIMIT $5 OFFSET $6
    `,
    [fromDate, toDate,charityType, `%${search}%`, limit, offset]
  );

  return result.rows;
};

const getDonations = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = query.search || "";
  const fromDate = query.fromDate || null;
  const toDate = query.toDate || null;
  const methodId = query.methodId || query.donationMethodId || null;

  const result = await pool.query(
    `
SELECT
  d.id,
  d.donor_id,
  d.donation_method_id,
  d.amount,
  d.donation_date,
  d.created_at,

      dn.full_name AS donor_name,
      dn.full_name AS name,
      dn.phone AS contact,

      dm.method_name AS donation_method,
      dm.method_name AS method,

      u.full_name AS created_by_name
    FROM donations d
    LEFT JOIN donors dn ON dn.id = d.donor_id
    LEFT JOIN donation_methods dm ON dm.id = d.donation_method_id
    LEFT JOIN users u ON u.id = d.created_by
    WHERE
      ($1::DATE IS NULL OR d.donation_date >= $1)
      AND ($2::DATE IS NULL OR d.donation_date <= $2)
      AND ($3::INT IS NULL OR d.donation_method_id = $3)
      AND (
        dn.full_name ILIKE $4
        OR dn.phone ILIKE $4
        OR dm.method_name ILIKE $4
      )
    ORDER BY d.id DESC
    LIMIT $5 OFFSET $6
    `,
    [
      fromDate,
      toDate,
      methodId,
      `%${search}%`,
      limit,
      offset,
    ]
  );

  return result.rows;
};

const getDonationById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      d.id,
      d.amount,
      d.donation_date,
      d.created_at,
      d.donor_id,
      d.donation_method_id,

      dn.full_name AS donor_name,
      dn.full_name AS name,
      dn.phone AS contact,

      dm.method_name AS donation_method,
      dm.method_name AS method,

      u.full_name AS created_by_name
    FROM donations d
    LEFT JOIN donors dn ON dn.id = d.donor_id
    LEFT JOIN donation_methods dm ON dm.id = d.donation_method_id
    LEFT JOIN users u ON u.id = d.created_by
    WHERE d.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Donation not found");
  }

  return result.rows[0];
};

const getDonorDonations = async (donorId) => {
  await getDonorById(donorId);

  const result = await pool.query(
    `
    SELECT
      d.id,
      d.amount,
      d.donation_date,
      d.created_at,
      d.donor_id,
      d.donation_method_id,

      dn.full_name AS donor_name,
      dn.phone AS contact,

      dm.method_name AS donation_method,
      dm.method_name AS method,

      u.full_name AS created_by_name
    FROM donations d
    LEFT JOIN donors dn ON dn.id = d.donor_id
    LEFT JOIN donation_methods dm ON dm.id = d.donation_method_id
    LEFT JOIN users u ON u.id = d.created_by
    WHERE d.donor_id = $1
    ORDER BY d.donation_date DESC, d.id DESC
    `,
    [donorId]
  );

  return result.rows;
};

const createDonationForDonor = async (donorId, data, currentUser) => {
  await getDonorById(donorId);

  return createDonation(
    {
      ...data,
      donorId,
    },
    currentUser
  );
};

const updateDonation = async (id, data, currentUser) => {
  await getDonationById(id);

  const finalAmount = Number(data.amount);
  const finalDate = data.date || data.donationDate || new Date();

  if (!finalAmount || finalAmount <= 0) {
    throw new ApiError(400, "Donation amount must be greater than zero");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const donorId = await findOrCreateDonorForDonation(client, data);
    const finalMethodId = await resolveDonationMethodId(client, data);

    const result = await client.query(
      `
      UPDATE donations
      SET
        donor_id = $1,
        donation_method_id = $2,
        amount = $3,
        donation_date = $4
      WHERE id = $5
      RETURNING *
      `,
      [
        donorId,
        finalMethodId,
        finalAmount,
        finalDate,
        id,
      ]
    );

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "UPDATE_DONATION",
        "welfare",
        `Updated donation ID ${id}`,
      ]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteDonation = async (id, currentUser) => {
  const donation = await getDonationById(id);

  const result = await pool.query(
    `
    DELETE FROM donations
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "DELETE_DONATION",
      "welfare",
      `Deleted donation amount ${donation.amount}`,
    ]
  );

  return result.rows[0];
};

const createWelfareApplication = async (data, currentUser) => {
  const {
    applicantName,
    fatherName,
    phone,
    cnic,
    gender,
    maritalStatus,
    familyMembers,
    // residenceType,
    // educationLevel,
    monthlyIncome,
    monthlyExpense,
    // supportType,
    requestedAmount,
    address,
    verificationNotes,

    area,
    houseStatus,
    community,
    needDescription,
    schoolName,
    verifierName,
    officeRemarks,
    needsSchoolFee,
    needsSchoolDress,
    needsSchoolUniform,
    needsSchoolBag,
    needsSchoolShoes,
    needsUniversityFee,
    needsOtherEducationHelp,
  } = data;

  if (!applicantName) {
    throw new ApiError(400, "Applicant name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO welfare_applications
    (
      applicant_name,
      father_name,
      phone,
      cnic,
      gender,
      marital_status,
      family_members,

      monthly_income,
      monthly_expense,
      requested_amount,
      address,
      verification_notes,

      area,
      house_status,
      community,
      need_description,
      school_name,
      verifier_name,
      office_remarks,
      needs_school_fee,
      needs_school_dress,
      needs_school_uniform,
      needs_school_bag,
      needs_school_shoes,
      needs_university_fee,
      needs_other_education_help,

      created_by
    )
VALUES
(
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
  $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
  $21,$22,$23,$24,$25,$26,$27
)
    RETURNING *
    `,
    [
      applicantName,
      fatherName || null,
      phone || null,
      cnic || null,
      gender || null,
      maritalStatus || null,
      Number(familyMembers || 0),
      // residenceType || null,
      // educationLevel || null,
      Number(monthlyIncome || 0),
      Number(monthlyExpense || 0),
      // supportType || null,
      Number(requestedAmount || 0),
      address || null,
      verificationNotes || null,

      area || null,
      houseStatus || null,
      community || null,
      needDescription || null,
      schoolName || null,
      verifierName || null,
      officeRemarks || null,
      Boolean(needsSchoolFee),
      Boolean(needsSchoolDress),
      Boolean(needsSchoolUniform),
      Boolean(needsSchoolBag),
      Boolean(needsSchoolShoes),
      Boolean(needsUniversityFee),
      Boolean(needsOtherEducationHelp),

      currentUser.id,
    ]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "CREATE_WELFARE_APPLICATION",
      "welfare",
      `Created welfare application for ${applicantName}`,
    ]
  );

  return result.rows[0];
};

const updateWelfareApplication = async (id, data, currentUser) => {
  await getWelfareApplicationById(id);

  const {
    applicantName,
    fatherName,
    phone,
    cnic,
    gender,
    maritalStatus,
    familyMembers,
    // residenceType,
    // educationLevel,
    monthlyIncome,
    monthlyExpense,
    // supportType,
    requestedAmount,
    address,
    verificationNotes,

    area,
    houseStatus,
    community,
    needDescription,
    schoolName,
    verifierName,
    officeRemarks,
    needsSchoolFee,
    needsSchoolDress,
    needsSchoolUniform,
    needsSchoolBag,
    needsSchoolShoes,
    needsUniversityFee,
    needsOtherEducationHelp,
  } = data;

  if (!applicantName) {
    throw new ApiError(400, "Applicant name is required");
  }

  const result = await pool.query(
    `
  UPDATE welfare_applications
  SET
    applicant_name = $1,
    father_name = $2,
    phone = $3,
    cnic = $4,
    gender = $5,
    marital_status = $6,
    family_members = $7,
    monthly_income = $8,
    monthly_expense = $9,
    requested_amount = $10,
    address = $11,
    verification_notes = $12,

    area = $13,
    house_status = $14,
    community = $15,
    need_description = $16,
    school_name = $17,
    verifier_name = $18,
    office_remarks = $19,
    needs_school_fee = $20,
    needs_school_dress = $21,
    needs_school_uniform = $22,
    needs_school_bag = $23,
    needs_school_shoes = $24,
    needs_university_fee = $25,
    needs_other_education_help = $26,

    updated_at = CURRENT_TIMESTAMP
  WHERE id = $27
  RETURNING *
  `,
    [
      applicantName,
      fatherName || null,
      phone || null,
      cnic || null,
      gender || null,
      maritalStatus || null,
      Number(familyMembers || 0),
      Number(monthlyIncome || 0),
      Number(monthlyExpense || 0),
      Number(requestedAmount || 0),
      address || null,
      verificationNotes || null,

      area || null,
      houseStatus || null,
      community || null,
      needDescription || null,
      schoolName || null,
      verifierName || null,
      officeRemarks || null,
      Boolean(needsSchoolFee),
      Boolean(needsSchoolDress),
      Boolean(needsSchoolUniform),
      Boolean(needsSchoolBag),
      Boolean(needsSchoolShoes),
      Boolean(needsUniversityFee),
      Boolean(needsOtherEducationHelp),

      id,
    ]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "UPDATE_WELFARE_APPLICATION",
      "welfare",
      `Updated welfare application for ${applicantName}`,
    ]
  );

  return result.rows[0];
};

const deleteWelfareApplication = async (id, currentUser) => {
  const application = await getWelfareApplicationById(id);

  const result = await pool.query(
    `
    DELETE FROM welfare_applications
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "DELETE_WELFARE_APPLICATION",
      "welfare",
      `Deleted welfare application for ${application.applicant_name}`,
    ]
  );

  return result.rows[0];
};

const getWelfareApplications = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = query.search || "";
  const caseStatus = query.caseStatus || null;
  const supportType = query.supportType || null;

  const result = await pool.query(
    `
    SELECT
      id,
      applicant_name,
      father_name,
      phone,
      cnic,
      gender,
      marital_status,
      family_members,

      monthly_income,
      monthly_expense,
      requested_amount,
      approved_amount,
      case_status,
      address,
      verification_notes,

      area,
      house_status,
      community,
      need_description,
      school_name,
      verifier_name,
      office_remarks,
      needs_school_fee,
      needs_school_dress,
      needs_school_uniform,
      needs_school_bag,
      needs_school_shoes,
      needs_university_fee,
      needs_other_education_help,

      created_at
    FROM welfare_applications
    WHERE
      (
        applicant_name ILIKE $1
        OR father_name ILIKE $1
        OR phone ILIKE $1
        OR cnic ILIKE $1
      )
AND ($2::VARCHAR IS NULL OR case_status = $2)
ORDER BY id DESC
LIMIT $3 OFFSET $4
    `,
    [`%${search}%`, caseStatus, limit, offset]
  );

  return result.rows;
};

const getWelfareApplicationById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      wa.*,
      created_user.full_name AS created_by_name,
      approved_user.full_name AS approved_by_name
    FROM welfare_applications wa
    LEFT JOIN users created_user ON created_user.id = wa.created_by
    LEFT JOIN users approved_user ON approved_user.id = wa.approved_by
    WHERE wa.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Welfare application not found");
  }

  return result.rows[0];
};

const createBeneficiaryAndCharityFromApprovedApplication = async (
  client,
  application,
  currentUser
) => {
  let charityId = null;

  if (application.cnic) {
    const existingByCnic = await client.query(
      `
      SELECT id
      FROM charities
      WHERE cnic = $1
      LIMIT 1
      `,
      [application.cnic]
    );

    if (existingByCnic.rows.length > 0) {
      charityId = existingByCnic.rows[0].id;
    }
  }

  if (!charityId && application.phone) {
    const existingByPhone = await client.query(
      `
      SELECT id
      FROM charities
      WHERE phone = $1
      LIMIT 1
      `,
      [application.phone]
    );

    if (existingByPhone.rows.length > 0) {
      charityId = existingByPhone.rows[0].id;
    }
  }

  if (!charityId) {
    const beneficiaryResult = await client.query(
      `
      INSERT INTO charities
      (
        charity_name,
        charity_type,
        contact_person,
        father_name,
        phone,
        cnic,
        address,
        description,
        family_members,
        monthly_income,
        is_active,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11)
      RETURNING id
      `,
      [
        application.applicant_name,
        "Education Help",
        application.applicant_name || null,
        application.father_name || null,
        application.phone || null,
        application.cnic || null,
        application.address || null,
        application.need_description || application.verification_notes || null,
        Number(application.family_members || 0),
        Number(application.monthly_income || 0),
        currentUser.id,
      ]
    );

    charityId = beneficiaryResult.rows[0].id;
  }

  const existingRecord = await client.query(
    `
    SELECT id
    FROM charity_records
    WHERE charity_id = $1
      AND charity_type = $2
      AND amount = $3
      AND note ILIKE $4
    LIMIT 1
    `,
    [
      charityId,
      "Education Help",
      Number(application.approved_amount || 0),
      `%Application ID ${application.id}%`,
    ]
  );

  if (existingRecord.rows.length === 0) {
    await client.query(
      `
      INSERT INTO charity_records
      (
        charity_id,
        charity_type,
        amount,
        item_name,
        quantity,
        charity_date,
        note,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,

      [
        charityId,
        "Education Help",
        Number(application.approved_amount || 0),
        null,
        0,
        new Date(),
        `Application ID ${application.id}. ${application.need_description || application.verification_notes || ""}`,
        currentUser.id,
      ]
    );
  }

  return charityId;
};

const updateWelfareApplicationStatus = async (id, data, currentUser) => {
  const { caseStatus, approvedAmount, verificationNotes } = data;

  if (!caseStatus) {
    throw new ApiError(400, "Case status is required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE welfare_applications
      SET
        case_status = $1::VARCHAR,
        approved_amount = COALESCE($2::NUMERIC, approved_amount),
        verification_notes = COALESCE($3::TEXT, verification_notes),
        approved_by = CASE 
          WHEN $1::VARCHAR IN ('approved', 'rejected', 'completed') THEN $4::INT
          ELSE approved_by
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5::INT
      RETURNING *
      `,
      [
        caseStatus,
        approvedAmount !== undefined ? Number(approvedAmount) : null,
        verificationNotes || null,
        currentUser.id,
        id,
      ]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Welfare application not found");
    }

    const application = result.rows[0];

    if (caseStatus === "approved") {
      await createBeneficiaryAndCharityFromApprovedApplication(
        client,
        application,
        currentUser
      );
    }

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "UPDATE_WELFARE_APPLICATION_STATUS",
        "welfare",
        `Updated welfare application ID ${id} to ${caseStatus}`,
      ]
    );

    await client.query("COMMIT");

    return application;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getDonationMethods = async () => {
  const result = await pool.query(
    `
    SELECT id, method_name, is_active
    FROM donation_methods
    WHERE is_active = TRUE
    ORDER BY method_name ASC
    `
  );

  return result.rows;
};

const createDonationMethod = async (data) => {
  const { methodName } = data;

  if (!methodName) {
    throw new ApiError(400, "Donation method name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO donation_methods (method_name)
    VALUES ($1)
    ON CONFLICT (method_name) DO NOTHING
    RETURNING *
    `,
    [methodName]
  );

  if (result.rows.length === 0) {
    throw new ApiError(409, "Donation method already exists");
  }

  return result.rows[0];
};

const createWelfareImpact = async (data, currentUser) => {
  const {
    title,
    livesTouched,
    urbanReach,
    ruralReach,
    activeGrants,
    note,
  } = data;

  if (!title) {
    throw new ApiError(400, "Impact title is required");
  }

  const result = await pool.query(
    `
    INSERT INTO welfare_impact_records
    (
      title,
      lives_touched,
      urban_reach,
      rural_reach,
      active_grants,
      note,
      created_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [
      title,
      livesTouched || 0,
      urbanReach || 0,
      ruralReach || 0,
      activeGrants || 0,
      note || null,
      currentUser.id,
    ]
  );

  return result.rows[0];
};

const getWelfareDashboard = async () => {
  const result = await pool.query(
    `
    SELECT
      COALESCE((SELECT SUM(amount) FROM donations), 0) AS total_donations,

COALESCE((
  SELECT SUM(amount)
  FROM charity_records
), 0) AS total_welfare_expenses,

      COUNT(*) FILTER (
        WHERE case_status = 'pending'
      ) AS pending_cases,

      COUNT(*) FILTER (
        WHERE case_status = 'approved'
      ) AS approved_cases,

      COUNT(*) FILTER (
        WHERE case_status = 'completed'
      ) AS completed_cases,

      COUNT(*) AS total_cases
    FROM welfare_applications
    `
  );

  const impactResult = await pool.query(
    `
    SELECT
      COALESCE(SUM(lives_touched), 0) AS lives_touched,
      COALESCE(SUM(urban_reach), 0) AS urban_reach,
      COALESCE(SUM(rural_reach), 0) AS rural_reach,
      COALESCE(SUM(active_grants), 0) AS active_grants
    FROM welfare_impact_records
    `
  );

  const recentActivities = await pool.query(
    `
    SELECT
      'donation' AS type,
      d.amount::TEXT AS title,
      d.donation_date AS activity_date,
      dm.method_name AS description
    FROM donations d
    LEFT JOIN donation_methods dm ON dm.id = d.donation_method_id

    UNION ALL

    SELECT
      'application' AS type,
      applicant_name AS title,
      created_at::DATE AS activity_date,
      support_type AS description
    FROM welfare_applications

    ORDER BY activity_date DESC
    LIMIT 10
    `
  );

  const monthlyDonationsResult = await pool.query(
    `
  SELECT
    TO_CHAR(months.month, 'Mon') AS month,
    COALESCE(SUM(d.amount), 0) AS amount
  FROM (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
      DATE_TRUNC('month', CURRENT_DATE),
      INTERVAL '1 month'
    ) AS month
  ) months
  LEFT JOIN donations d
    ON DATE_TRUNC('month', d.donation_date) = months.month
  GROUP BY months.month
  ORDER BY months.month ASC
  `
  );

  const monthlyCharityResult = await pool.query(
    `
  SELECT
    TO_CHAR(months.month, 'Mon') AS month,
    COALESCE(SUM(cr.amount), 0) AS amount
  FROM (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
      DATE_TRUNC('month', CURRENT_DATE),
      INTERVAL '1 month'
    ) AS month
  ) months
  LEFT JOIN charity_records cr
    ON DATE_TRUNC('month', cr.charity_date) = months.month
  GROUP BY months.month
  ORDER BY months.month ASC
  `
  );

  const data = result.rows[0];
  const impact = impactResult.rows[0];

  const totalDonations = Number(data.total_donations) || 0;
  const totalExpenses = Number(data.total_welfare_expenses) || 0;

  return {
    totalDonations,
    totalWelfareExpenses: totalExpenses,
    availableBalance: totalDonations - totalExpenses,
    totalCases: Number(data.total_cases) || 0,
    pendingCases: Number(data.pending_cases) || 0,
    approvedCases: Number(data.approved_cases) || 0,
    completedCases: Number(data.completed_cases) || 0,
    livesTouched: Number(impact.lives_touched) || 0,
    urbanReach: Number(impact.urban_reach) || 0,
    ruralReach: Number(impact.rural_reach) || 0,
    activeGrants: Number(impact.active_grants) || 0,
    recentActivities: recentActivities.rows,

    monthlyDonations: monthlyDonationsResult.rows.map((row) => ({
      month: row.month,
      amount: Number(row.amount) || 0,
    })),

    monthlyCharity: monthlyCharityResult.rows.map((row) => ({
      month: row.month,
      amount: Number(row.amount) || 0,
    })),
  };
};

module.exports = {
  createDonor,
  getDonors,
  getDonorById,
  updateDonor,
  deleteDonor,

  createCharity,
  getCharities,
  getCharityById,
  updateCharity,
  deleteCharity,
  getCharityHistory,
  createCharityForProfile,
  getAllCharityRecords,

  createDonation,
  getDonations,
  getDonationById,
  getDonorDonations,
  createDonationForDonor,
  updateDonation,
  deleteDonation,

  createWelfareApplication,
  getWelfareApplications,
  getWelfareApplicationById,
  updateWelfareApplication,
  deleteWelfareApplication,
  updateWelfareApplicationStatus,

  getDonationMethods,
  createDonationMethod,

  createWelfareImpact,
  getWelfareDashboard,
};