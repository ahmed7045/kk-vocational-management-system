const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const {
  createDonor,
  getDonors,
  updateDonor,
  deleteDonor,

  createCharity,
  getCharities,
  updateCharity,
  deleteCharity,
  getCharityHistory,
  createCharityForProfile,
  getAllCharityRecords,
  getCharityRecordsReportData,
  getCharityRecordsTotal,

  createDonation,
  getDonations,
  getDonationsReportData,
  getDonationsTotal,
  updateDonation,
  deleteDonation,
  getDonorDonations,
  createDonationForDonor,

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
} = require("./welfare.service");

const createDonorController = async (req, res, next) => {
  try {
    const data = await createDonor(req.body);

    res.status(201).json({
      success: true,
      message: "Donor created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDonorsController = async (req, res, next) => {
  try {
    const data = await getDonors(req.query);

    res.status(200).json({
      success: true,
      message: "Donors fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateDonorController = async (req, res, next) => {
  try {
    const data = await updateDonor(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Donor updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDonorController = async (req, res, next) => {
  try {
    await deleteDonor(req.params.id);

    res.status(200).json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const createCharityController = async (req, res, next) => {
  try {
    const data = await createCharity(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Charity created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCharitiesController = async (req, res, next) => {
  try {
    const data = await getCharities(req.query);

    res.status(200).json({
      success: true,
      message: "Charities fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateCharityController = async (req, res, next) => {
  try {
    const data = await updateCharity(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Charity updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCharityController = async (req, res, next) => {
  try {
    await deleteCharity(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Charity deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getCharityHistoryController = async (req, res, next) => {
  try {
    const data = await getCharityHistory(req.params.id);

    res.status(200).json({
      success: true,
      message: "Charity history fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createCharityForProfileController = async (req, res, next) => {
  try {
    const data = await createCharityForProfile(
      req.params.id,
      req.body,
      req.user
    );

    res.status(201).json({
      success: true,
      message: "Charity record added successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const formatReportDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatReportCurrency = (amount) => {
  return `Rs ${Number(amount || 0).toLocaleString("en-PK")}`;
};

const REPORT_FOOTER_TEXT = "Powered by Cybrox - cybrox.info";

const addReportFooter = (doc) => {
  const pages = doc.bufferedPageRange();

  for (let i = pages.start; i < pages.start + pages.count; i += 1) {
    doc.switchToPage(i);

    const footerY = doc.page.height - 24;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6b7280")
      .text(REPORT_FOOTER_TEXT, 0, footerY, {
        width: doc.page.width,
        align: "center",
        lineBreak: false,
      });

    doc.fillColor("#111827");
  }
};

const getMonthName = (month) => {
  if (!month) return "-";

  return new Date(2026, Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
};

const getAllCharityRecordsController = async (req, res, next) => {
  try {
    const records = await getAllCharityRecords(req.query);
    const totalCharity = await getCharityRecordsTotal(req.query);

    res.status(200).json({
      success: true,
      message: "Charity records fetched successfully",
      data: records,
      totalCharity,
    });
  } catch (error) {
    next(error);
  }
};

const charityRecordsPdfReportController = async (req, res, next) => {
  try {
    const records = await getCharityRecordsReportData(req.query);
    const totalCharity = await getCharityRecordsTotal(req.query);

    const doc = new PDFDocument({
      size: "A4",
      margin: 35,
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="charity-history-report.pdf"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const logoPath = path.join(__dirname, "../../assets/logo.png");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth / 2 - 38, 25, {
        width: 76,
        height: 76,
      });
    }

    doc.y = 115;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#111827")
      .text("Charity History Report", {
        align: "center",
      });

    doc.moveDown(0.4);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Report Generated: ${formatReportDate(new Date())}`, {
        align: "center",
      });

    doc.moveDown(1);

    const filters = [];

    if (req.query.search) {
      filters.push(`Search: ${req.query.search}`);
    }

    if (req.query.fromDate && req.query.toDate) {
      filters.push(
        `Date Range: ${formatReportDate(req.query.fromDate)} to ${formatReportDate(req.query.toDate)}`
      );
    } else {
      filters.push(
        `Month/Year: ${getMonthName(req.query.month)} ${req.query.year || ""}`
      );
    }

    filters.push(`Type: ${req.query.charityType || "All Types"}`);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Filters:");

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(filters.join(" | "));

    doc.moveDown(0.6);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Total Charity: ${formatReportCurrency(totalCharity)}`);

    doc.moveDown(1);

    const startX = 35;
    let y = doc.y;

    const columns = [
      { title: "S.No", width: 45 },
      { title: "Beneficiary", width: 155 },
      { title: "Type", width: 130 },
      { title: "Amount", width: 90 },
      { title: "Date", width: 105 },
    ];

    const drawTableHeader = () => {
      let x = startX;

      doc
        .rect(startX, y, 525, 24)
        .fill("#eff6ff");

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .fontSize(8.5);

      columns.forEach((column) => {
        doc.text(column.title, x + 4, y + 8, {
          width: column.width - 8,
          lineBreak: false,
        });

        x += column.width;
      });

      y += 24;
      doc.fillColor("#111827");
    };

    const drawRow = (record, index) => {
      if (y > 760) {
        doc.addPage();
        y = 35;
        drawTableHeader();
      }

      let x = startX;

      if (index % 2 === 0) {
        doc
          .rect(startX, y, 525, 28)
          .fill("#f8fafc")
          .fillColor("#111827");
      }

      const rowValues = [
        index + 1,
        record.beneficiary_name || "-",
        record.charity_type || "-",
        formatReportCurrency(record.amount || 0),
        formatReportDate(record.charity_date),
      ];

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#111827");

      rowValues.forEach((value, columnIndex) => {
        doc.text(String(value), x + 4, y + 8, {
          width: columns[columnIndex].width - 8,
          lineBreak: false,
          ellipsis: true,
        });

        x += columns[columnIndex].width;
      });

      y += 28;
    };

    drawTableHeader();

    if (records.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .text("No charity records found for selected filters.", startX, y + 15);
    } else {
      records.forEach((record, index) => {
        drawRow(record, index);
      });
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Total Records: ${records.length}`, startX, y + 14);

    addReportFooter(doc);
    doc.end();
  } catch (error) {
    next(error);
  }
};

const donationsPdfReportController = async (req, res, next) => {
  try {
    const donations = await getDonationsReportData(req.query);
    const totalDonation = await getDonationsTotal(req.query);

    const doc = new PDFDocument({
      size: "A4",
      margin: 35,
      bufferPages: true,  
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="donations-report.pdf"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const logoPath = path.join(__dirname, "../../assets/logo.png");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth / 2 - 38, 25, {
        width: 76,
        height: 76,
      });
    }

    doc.y = 115;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#111827")
      .text("Donations Report", {
        align: "center",
      });

    doc.moveDown(0.4);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Report Generated: ${formatReportDate(new Date())}`, {
        align: "center",
      });

    doc.moveDown(1);

    const filters = [];

    if (req.query.search) {
      filters.push(`Search: ${req.query.search}`);
    }

    if (req.query.fromDate && req.query.toDate) {
      filters.push(
        `Date Range: ${formatReportDate(req.query.fromDate)} to ${formatReportDate(req.query.toDate)}`
      );
    } else {
      filters.push(
        `Month/Year: ${getMonthName(req.query.month)} ${req.query.year || ""}`
      );
    }

    filters.push("Method: Selected Filter");

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Filters:");

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(filters.join(" | "));

    doc.moveDown(0.6);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Total Donation: ${formatReportCurrency(totalDonation)}`);

    doc.moveDown(1);

    const startX = 35;
    let y = doc.y;

    const columns = [
      { title: "S.No", width: 55 },
      { title: "Name", width: 190 },
      { title: "Amount", width: 130 },
      { title: "Method", width: 150 },
    ];

    const drawTableHeader = () => {
      let x = startX;

      doc
        .rect(startX, y, 525, 24)
        .fill("#eff6ff");

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .fontSize(8.5);

      columns.forEach((column) => {
        doc.text(column.title, x + 4, y + 8, {
          width: column.width - 8,
          lineBreak: false,
        });

        x += column.width;
      });

      y += 24;
      doc.fillColor("#111827");
    };

    const drawRow = (donation, index) => {
      if (y > 760) {
        doc.addPage();
        y = 35;
        drawTableHeader();
      }

      let x = startX;

      if (index % 2 === 0) {
        doc
          .rect(startX, y, 525, 28)
          .fill("#f8fafc")
          .fillColor("#111827");
      }

      const rowValues = [
        index + 1,
        donation.name || donation.donor_name || "-",
        formatReportCurrency(donation.amount || 0),
        donation.method || donation.donation_method || "-",
      ];

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#111827");

      rowValues.forEach((value, columnIndex) => {
        doc.text(String(value), x + 4, y + 8, {
          width: columns[columnIndex].width - 8,
          lineBreak: false,
          ellipsis: true,
        });

        x += columns[columnIndex].width;
      });

      y += 28;
    };

    drawTableHeader();

    if (donations.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .text("No donations found for selected filters.", startX, y + 15);
    } else {
      donations.forEach((donation, index) => {
        drawRow(donation, index);
      });
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Total Records: ${donations.length}`, startX, y + 14);

    addReportFooter(doc);
    doc.end();
  } catch (error) {
    next(error);
  }
};

const createDonationController = async (req, res, next) => {
  try {
    const data = await createDonation(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDonationsController = async (req, res, next) => {
  try {
    const donations = await getDonations(req.query);
    const totalDonation = await getDonationsTotal(req.query);

    res.status(200).json({
      success: true,
      message: "Donations fetched successfully",
      data: donations,
      totalDonation,
    });
  } catch (error) {
    next(error);
  }
};

const updateDonationController = async (req, res, next) => {
  try {
    const data = await updateDonation(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Donation updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDonationController = async (req, res, next) => {
  try {
    await deleteDonation(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Donation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getDonorDonationsController = async (req, res, next) => {
  try {
    const data = await getDonorDonations(req.params.id);

    res.status(200).json({
      success: true,
      message: "Donor donations fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createDonationForDonorController = async (req, res, next) => {
  try {
    const data = await createDonationForDonor(
      req.params.id,
      req.body,
      req.user
    );

    res.status(201).json({
      success: true,
      message: "Donation added for donor successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createApplicationController = async (req, res, next) => {
  try {
    const data = await createWelfareApplication(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Welfare application created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicationsController = async (req, res, next) => {
  try {
    const data = await getWelfareApplications(req.query);

    res.status(200).json({
      success: true,
      message: "Welfare applications fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicationDetailsController = async (req, res, next) => {
  try {
    const data = await getWelfareApplicationById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Welfare application fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationController = async (req, res, next) => {
  try {
    const data = await updateWelfareApplication(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Welfare application updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteApplicationController = async (req, res, next) => {
  try {
    await deleteWelfareApplication(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Welfare application deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatusController = async (req, res, next) => {
  try {
    const data = await updateWelfareApplicationStatus(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Welfare application status updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDonationMethodsController = async (req, res, next) => {
  try {
    const data = await getDonationMethods();

    res.status(200).json({
      success: true,
      message: "Donation methods fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createDonationMethodController = async (req, res, next) => {
  try {
    const data = await createDonationMethod(req.body);

    res.status(201).json({
      success: true,
      message: "Donation method created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createImpactController = async (req, res, next) => {
  try {
    const data = await createWelfareImpact(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Welfare impact record created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const dashboardController = async (req, res, next) => {
  try {
    const data = await getWelfareDashboard();

    res.status(200).json({
      success: true,
      message: "Welfare dashboard fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonorController,
  getDonorsController,
  updateDonorController,
  deleteDonorController,

  createCharityController,
  getCharitiesController,
  updateCharityController,
  deleteCharityController,
  getCharityHistoryController,
  createCharityForProfileController,
  getAllCharityRecordsController,
  charityRecordsPdfReportController,

  createDonationController,
  getDonationsController,

  updateDonationController,
  deleteDonationController,

  createApplicationController,
  getApplicationsController,
  getApplicationDetailsController,
  updateApplicationController,
  deleteApplicationController,
  updateApplicationStatusController,

  getDonationMethodsController,
  donationsPdfReportController,
  createDonationMethodController,

  createImpactController,
  dashboardController,

  getDonorDonationsController,
  createDonationForDonorController,
};