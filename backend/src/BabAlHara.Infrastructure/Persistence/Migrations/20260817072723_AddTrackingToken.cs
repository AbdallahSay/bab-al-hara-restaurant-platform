using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackingToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TrackingTokenHash",
                schema: "app",
                table: "Orders",
                type: "varchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE [app].[Orders]
                SET [TrackingTokenHash] = LOWER(CONVERT(varchar(64), HASHBYTES('SHA2_256', CONVERT(varchar(36), NEWID()) + ':' + CONVERT(varchar(36), [Id]) + ':' + CONVERT(varchar(50), SYSDATETIMEOFFSET())), 2))
                WHERE [TrackingTokenHash] IS NULL OR [TrackingTokenHash] = '';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "TrackingTokenHash",
                schema: "app",
                table: "Orders",
                type: "varchar(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TrackingTokenHash",
                schema: "app",
                table: "Orders",
                column: "TrackingTokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_TrackingTokenHash",
                schema: "app",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "TrackingTokenHash",
                schema: "app",
                table: "Orders");
        }
    }
}
