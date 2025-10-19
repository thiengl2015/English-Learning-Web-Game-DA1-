const { Parser } = require("json2csv");
const users = require("../models/User"); // hoặc import mảng users hiện có

exports.exportUsersReport = (req, res) => {
  try {
    const fields = [
      "id",
      "username",
      "email",
      "level",
      "subscription",
      "status",
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(users);

    res.header("Content-Type", "text/csv");
    res.attachment("user_report.csv");
    return res.send(csv);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error exporting data", error: err.message });
  }
};
