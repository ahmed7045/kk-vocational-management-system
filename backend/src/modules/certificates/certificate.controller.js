const {
  generateCertificate,
  getCertificates,
  getCertificateById,
} = require("./certificate.service");

const generateCertificatePdf = require("./certificate.pdf");

const create = async (req, res, next) => {
  try {
    const certificate = await generateCertificate(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Certificate generated successfully",
      data: certificate,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const certificates = await getCertificates(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Certificates fetched successfully",
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
};

const download = async (req, res, next) => {
  try {
    const certificate = await getCertificateById(req.params.id, req.user);
    generateCertificatePdf(certificate, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  download,
};