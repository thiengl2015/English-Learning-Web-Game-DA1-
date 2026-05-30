module.exports = (sequelize, DataTypes) => {
  const PracticeProgress = sequelize.define(
    "PracticeProgress",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      topic_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "practice_topics",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      completed_items: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_items: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      best_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      attempts_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      last_attempt_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "practice_progress",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "topic_id"],
        },
      ],
      hooks: {
        beforeUpdate: (progress) => {
          progress.updated_at = new Date();
        },
      },
    }
  );

  PracticeProgress.associate = (models) => {
    PracticeProgress.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    PracticeProgress.belongsTo(models.PracticeTopic, {
      foreignKey: "topic_id",
      as: "topic",
    });
  };

  return PracticeProgress;
};
