module.exports = (sequelize, DataTypes) => {
  const QuestionChallenge = sequelize.define(
    "QuestionChallenge",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "units",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      section: {
        type: DataTypes.ENUM("A", "B", "C", "D"),
        allowNull: false,
        comment: "Section A: match, B: listen_write, C: word_bank, D: listen_repeat",
      },
      question_type: {
        type: DataTypes.ENUM("match", "listen_write", "fill_blank", "word_bank", "listen_repeat"),
        allowNull: false,
        comment: "Loai cau hoi",
      },
      content: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Noi dung cau hoi (khong co dap an)",
      },
      correct_answer: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Dap an dung",
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Diem cho cau nay",
      },
      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Thu tu hien thi trong section",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "question_challenges",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  QuestionChallenge.associate = (models) => {
    QuestionChallenge.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });
  };

  return QuestionChallenge;
};
