module.exports = (sequelize, DataTypes) => {
  const PlacementTopic = sequelize.define(
    "PlacementTopic",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Topic name in English",
      },
      name_vi: {
        type: DataTypes.STRING(150),
        allowNull: false,
        comment: "Topic name in Vietnamese",
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      icon: {
        type: DataTypes.STRING(10),
        defaultValue: "📚",
        comment: "Emoji icon",
      },
      difficulty_range: {
        type: DataTypes.ENUM("beginner", "intermediate", "advanced", "all"),
        defaultValue: "all",
      },
      min_age: {
        type: DataTypes.INTEGER,
        defaultValue: 8,
        comment: "Minimum age for this topic",
      },
      max_age: {
        type: DataTypes.INTEGER,
        defaultValue: 18,
        comment: "Maximum age for this topic",
      },
      unit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "units",
          key: "id",
        },
        comment: "Unit unlocked when this topic is mastered in placement",
      },
      unit_order: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Display order aligned with unit order",
      },
      vocabulary_keywords: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: "JSON array of keywords to guide AI question generation",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      tableName: "placement_topics",
      underscored: true,
      hooks: {
        beforeUpdate: (topic) => {
          topic.updated_at = new Date();
        },
      },
    }
  );

  PlacementTopic.associate = (models) => {
    PlacementTopic.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });
  };

  return PlacementTopic;
};
