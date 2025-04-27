using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ALP.Model.Migrations
{
    /// <inheritdoc />
    public partial class InitialEmptyModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdditionalProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DurationInDays = table.Column<int>(type: "int", nullable: true),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdditionalProducts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DurationInMonths = table.Column<int>(type: "int", nullable: false),
                    PricePerMonth = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdditionalProductPurchases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BusinessUserId = table.Column<int>(type: "int", nullable: false),
                    AdditionalProductId = table.Column<int>(type: "int", nullable: false),
                    ListingId = table.Column<int>(type: "int", nullable: true),
                    PurchasedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ActualPricePaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EffectStartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EffectEndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdditionalProductPurchases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdditionalProductPurchases_AdditionalProducts",
                        column: x => x.AdditionalProductId,
                        principalTable: "AdditionalProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AdditionalProductPurchases_Users",
                        column: x => x.BusinessUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Listings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BusinessUserId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CurrentSubscriptionId = table.Column<int>(type: "int", nullable: true),
                    Discriminator = table.Column<string>(type: "nvarchar(21)", maxLength: 21, nullable: false),
                    ListingType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Make = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Model = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Year = table.Column<int>(type: "int", nullable: true),
                    Kilometers = table.Column<int>(type: "int", nullable: true),
                    SizeSquareMeters = table.Column<int>(type: "int", nullable: true),
                    NumberOfRooms = table.Column<int>(type: "int", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Region = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Builder = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    YachtListing_Model = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    LengthOverallMeters = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    BuildYear = table.Column<int>(type: "int", nullable: true),
                    Cabins = table.Column<int>(type: "int", nullable: true),
                    Berths = table.Column<int>(type: "int", nullable: true),
                    YachtListing_Location = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    EmploymentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Salary = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Listings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Listings_Users_BusinessUserId",
                        column: x => x.BusinessUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ListingId = table.Column<int>(type: "int", nullable: false),
                    BusinessUserId = table.Column<int>(type: "int", nullable: false),
                    SubscriptionPlanId = table.Column<int>(type: "int", nullable: false),
                    PurchasedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ActualPricePaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Listings_History",
                        column: x => x.ListingId,
                        principalTable: "Listings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Subscriptions_SubscriptionPlans",
                        column: x => x.SubscriptionPlanId,
                        principalTable: "SubscriptionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Users_BusinessUserId",
                        column: x => x.BusinessUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalProductPurchases_AdditionalProductId",
                table: "AdditionalProductPurchases",
                column: "AdditionalProductId");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalProductPurchases_BusinessUserId",
                table: "AdditionalProductPurchases",
                column: "BusinessUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalProductPurchases_Listing_EffectEndDate",
                table: "AdditionalProductPurchases",
                columns: new[] { "ListingId", "EffectEndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalProductPurchases_ListingId",
                table: "AdditionalProductPurchases",
                column: "ListingId");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalProductPurchases_PurchasedAt",
                table: "AdditionalProductPurchases",
                column: "PurchasedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalProductPurchases_Status",
                table: "AdditionalProductPurchases",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalProducts_IsAvailable",
                table: "AdditionalProducts",
                column: "IsAvailable");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalProducts_Type",
                table: "AdditionalProducts",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Builder",
                table: "Listings",
                column: "Builder");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_BuildYear",
                table: "Listings",
                column: "BuildYear");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_BusinessUserId",
                table: "Listings",
                column: "BusinessUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_City",
                table: "Listings",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_CreatedAt",
                table: "Listings",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_EmploymentType",
                table: "Listings",
                column: "EmploymentType");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_LengthOverallMeters",
                table: "Listings",
                column: "LengthOverallMeters");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_ListingType",
                table: "Listings",
                column: "ListingType");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Location",
                table: "Listings",
                column: "Location");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Make",
                table: "Listings",
                column: "Make");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Model",
                table: "Listings",
                column: "Model");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_PostalCode",
                table: "Listings",
                column: "PostalCode");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Price",
                table: "Listings",
                column: "Price");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Region",
                table: "Listings",
                column: "Region");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Salary",
                table: "Listings",
                column: "Salary");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_SizeSquareMeters",
                table: "Listings",
                column: "SizeSquareMeters");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_Year",
                table: "Listings",
                column: "Year");

            migrationBuilder.CreateIndex(
                name: "UQ_Listings_CurrentSubscriptionId",
                table: "Listings",
                column: "CurrentSubscriptionId",
                unique: true,
                filter: "[CurrentSubscriptionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPlans_IsAvailable",
                table: "SubscriptionPlans",
                column: "IsAvailable");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_BusinessUserId",
                table: "Subscriptions",
                column: "BusinessUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_EndDate",
                table: "Subscriptions",
                column: "EndDate");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_Listing_EndDate",
                table: "Subscriptions",
                columns: new[] { "ListingId", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_ListingId",
                table: "Subscriptions",
                column: "ListingId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_SubscriptionPlanId",
                table: "Subscriptions",
                column: "SubscriptionPlanId");

            migrationBuilder.CreateIndex(
                name: "UQ_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AdditionalProductPurchases_Listings",
                table: "AdditionalProductPurchases",
                column: "ListingId",
                principalTable: "Listings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Subscriptions_CurrentSubscriptionId",
                table: "Listings",
                column: "CurrentSubscriptionId",
                principalTable: "Subscriptions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_Listings_History",
                table: "Subscriptions");

            migrationBuilder.DropTable(
                name: "AdditionalProductPurchases");

            migrationBuilder.DropTable(
                name: "AdditionalProducts");

            migrationBuilder.DropTable(
                name: "Listings");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropTable(
                name: "SubscriptionPlans");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
