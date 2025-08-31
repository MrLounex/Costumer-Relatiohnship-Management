const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const ExcelJS = require("exceljs");
const { Parser } = require("json2csv");

// ✅ Export ke Excel
router.get("/export/excel", async (req, res) => {
  try {
    const contacts = await Contact.find().lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Contacts");

    worksheet.columns = [
      { header: "Nama", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Telepon", key: "phone", width: 20 },
      { header: "Perusahaan", key: "company", width: 25 }
    ];

    contacts.forEach(contact => {
      worksheet.addRow(contact);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=contacts.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal export Excel");
  }
});

// ✅ Export ke CSV
router.get("/export/csv", async (req, res) => {
  try {
    const contacts = await Contact.find().lean();
    const fields = ["name", "email", "phone", "company"];
    const parser = new Parser({ fields });
    const csv = parser.parse(contacts);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=contacts.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal export CSV");
  }
});

module.exports = router;
