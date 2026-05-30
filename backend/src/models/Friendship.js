module.exports = (sequelize, DataTypes) => {
  const Friendship = sequelize.define(
    "Friendship",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      requester_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      addressee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("pending", "accepted"),
        defaultValue: "accepted",
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
      tableName: "friendships",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["requester_id", "addressee_id"],
        },
        {
          fields: ["addressee_id"],
        },
      ],
      hooks: {
        beforeUpdate: (friendship) => {
          friendship.updated_at = new Date();
        },
      },
    }
  );

  Friendship.associate = (models) => {
    Friendship.belongsTo(models.User, {
      foreignKey: "requester_id",
      as: "requester",
    });
    Friendship.belongsTo(models.User, {
      foreignKey: "addressee_id",
      as: "addressee",
    });
  };

  return Friendship;
};
