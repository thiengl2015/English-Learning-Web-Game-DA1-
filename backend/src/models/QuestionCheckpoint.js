module.exports = (sequelize, DataTypes) => {
  const QuestionCheckpoint = sequelize.define(
    "QuestionCheckpoint",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      checkpoint_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
          model: "unit_test_configs",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      section: {
        type: DataTypes.ENUM("A", "B", "C", "D", "E"),
        allowNull: false,
        comment: "Section A: match, B: listen_write, C: fill_blank, D: unscramble, E: read_speak",
      },
      question_type: {
        type: DataTypes.ENUM("match", "listen_write", "fill_blank", "unscramble", "read_speak"),
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
        get() {
          const value = this.getDataValue("correct_answer");
          if (typeof value === "string") {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          }
          return value;
        },
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
      tableName: "question_checkpoints",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  QuestionCheckpoint.associate = (models) => {
    QuestionCheckpoint.belongsTo(models.UnitTestConfig, {
      foreignKey: "checkpoint_id",
      as: "config",
    });
  };

  return QuestionCheckpoint;
};
