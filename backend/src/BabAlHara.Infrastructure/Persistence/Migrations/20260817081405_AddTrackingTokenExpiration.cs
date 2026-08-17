using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BabAlHara.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackingTokenExpiration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TrackingTokenExpiresAtUtc",
                schema: "app",
                table: "Orders",
                type: "datetimeoffset(7)",
                precision: 7,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TrackingTokenExpiresAtUtc",
                schema: "app",
                table: "Orders");
        }
    }
}
