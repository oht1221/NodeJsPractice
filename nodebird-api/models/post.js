module.exports = (sequelize, DataTypes) => (
    sequelize.define('posts', {
        content: {
            type: DataTypes.STRING(40),
            allowNull: false,
        }, 
        img: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
    }, {
        timestamps: true,
        paranoid: true,
    })
);