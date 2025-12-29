module.exports = (sequelize, DataTypes) => {
  const UserVocabulary = sequelize.define(
    "UserVocabulary",
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
      vocab_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "vocabulary",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      is_favorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      mastery_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "0-5: Level of mastery",
      },
      correct_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      incorrect_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      last_reviewed: {
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
      tableName: "user_vocabulary",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "vocab_id"],
        },
        {
          fields: ["is_favorite"],
        },
      ],
      hooks: {
        beforeUpdate: (userVocab) => {
          userVocab.updated_at = new Date();
        },
      },
    }
  );

  UserVocabulary.associate = (models) => {
    UserVocabulary.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    UserVocabulary.belongsTo(models.Vocabulary, {
      foreignKey: "vocab_id",
      as: "vocabulary",
    });
  };

  return UserVocabulary;
};
