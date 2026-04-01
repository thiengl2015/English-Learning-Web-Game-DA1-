const { Parser } = require("json2csv");
const { User, UserProgress } = require("../models");

exports.exportUsersReport = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "display_name",
        "level",
        "subscription",
        "status",
        "role",
        "joined_date",
        "last_active",
      ],
      include: [
        {
          model: UserProgress,
          as: "progress",
          attributes: ["total_xp", "weekly_xp", "streak_days", "league"],
        },
      ],
      raw: false,
    });

    const flatUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      level: user.level,
      subscription: user.subscription,
      status: user.status,
      role: user.role,
      joined_date: user.joined_date,
      last_active: user.last_active,
      total_xp: user.progress ? user.progress.total_xp : null,
      streak_days: user.progress ? user.progress.streak_days : null,
      league: user.progress ? user.progress.league : null,
    }));

    const fields = [
      "id",
      "username",
      "email",
      "display_name",
      "level",
      "subscription",
      "status",
      "role",
      "joined_date",
      "last_active",
      "total_xp",
      "streak_days",
      "league",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flatUsers);

    res.header("Content-Type", "text/csv");
    res.attachment("user_report.csv");
    return res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    return res
      .status(500)
      .json({ message: "Error exporting data", error: err.message });
  }
};
