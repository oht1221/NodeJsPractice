module.exports = (sequelize, DataTypes) => (
    sequelize.define('good', {
        name: {
            type: DataTypes.STRING(40),
            allowNull: false
        },

        img: {
            type: DataTypes.STRING(200),
            allowNull: false
        },

        price: {
            type: DataTypes.INTEGER
        }
    },
    {
        timestamps: true,
        paranoid: true
    })
);