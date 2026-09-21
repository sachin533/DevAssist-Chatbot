-- Phonebook Application — SQL Server Express setup
-- Run with: sqlcmd -S ".\SQLEXPRESS" -E -i sql\schema.sql
-- Creates database PhonebookDB, Contacts table, and stored procedures.

IF DB_ID(N'PhonebookDB') IS NULL
BEGIN
  CREATE DATABASE PhonebookDB;
END
GO

USE PhonebookDB;
GO

IF OBJECT_ID(N'dbo.Contacts', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Contacts (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(255) NULL,
    Address NVARCHAR(MAX) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
  );
  CREATE INDEX IX_Contacts_Name ON dbo.Contacts (Name ASC);
END
GO

-- Paged list with optional search. Only the requested slice leaves SQL Server.
IF OBJECT_ID(N'dbo.sp_GetContactsPaged', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetContactsPaged;
GO
CREATE PROCEDURE dbo.sp_GetContactsPaged
  @PageNumber INT = 1,
  @PageSize INT = 10,
  @SearchTerm NVARCHAR(255) = NULL,
  @TotalCount INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  IF (@PageNumber < 1) SET @PageNumber = 1;
  IF (@PageSize < 1) SET @PageSize = 10;
  IF (@PageSize > 100) SET @PageSize = 100;

  SELECT @TotalCount = COUNT(*)
  FROM dbo.Contacts
  WHERE (@SearchTerm IS NULL OR @SearchTerm = N''
     OR Name LIKE N'%' + @SearchTerm + N'%'
     OR PhoneNumber LIKE N'%' + @SearchTerm + N'%'
     OR Email LIKE N'%' + @SearchTerm + N'%');

  SELECT Id, Name, PhoneNumber, Email, Address, CreatedAt
  FROM dbo.Contacts
  WHERE (@SearchTerm IS NULL OR @SearchTerm = N''
     OR Name LIKE N'%' + @SearchTerm + N'%'
     OR PhoneNumber LIKE N'%' + @SearchTerm + N'%'
     OR Email LIKE N'%' + @SearchTerm + N'%')
  ORDER BY Name ASC, Id ASC
  OFFSET (@PageNumber - 1) * @PageSize ROWS
  FETCH NEXT @PageSize ROWS ONLY;
END
GO

IF OBJECT_ID(N'dbo.sp_GetContactById', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetContactById;
GO
CREATE PROCEDURE dbo.sp_GetContactById
  @Id INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT Id, Name, PhoneNumber, Email, Address, CreatedAt
  FROM dbo.Contacts
  WHERE Id = @Id;
END
GO

IF OBJECT_ID(N'dbo.sp_InsertContact', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_InsertContact;
GO
CREATE PROCEDURE dbo.sp_InsertContact
  @Name NVARCHAR(255),
  @PhoneNumber NVARCHAR(50),
  @Email NVARCHAR(255) = NULL,
  @Address NVARCHAR(MAX) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.Contacts (Name, PhoneNumber, Email, Address)
  VALUES (@Name, @PhoneNumber, NULLIF(@Email, N''), NULLIF(@Address, N''));
  SELECT CAST(SCOPE_IDENTITY() AS INT) AS Id;
END
GO

IF OBJECT_ID(N'dbo.sp_UpdateContact', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_UpdateContact;
GO
CREATE PROCEDURE dbo.sp_UpdateContact
  @Id INT,
  @Name NVARCHAR(255),
  @PhoneNumber NVARCHAR(50),
  @Email NVARCHAR(255) = NULL,
  @Address NVARCHAR(MAX) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.Contacts
  SET Name = @Name,
      PhoneNumber = @PhoneNumber,
      Email = NULLIF(@Email, N''),
      Address = NULLIF(@Address, N'')
  WHERE Id = @Id;
END
GO

IF OBJECT_ID(N'dbo.sp_DeleteContact', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_DeleteContact;
GO
CREATE PROCEDURE dbo.sp_DeleteContact
  @Id INT
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.Contacts WHERE Id = @Id;
END
GO

-- Helper for the optional "unique phone" pre-check endpoint.
IF OBJECT_ID(N'dbo.sp_CheckPhoneExists', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_CheckPhoneExists;
GO
CREATE PROCEDURE dbo.sp_CheckPhoneExists
  @PhoneNumber NVARCHAR(50),
  @ExcludeId INT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT CAST(CASE WHEN EXISTS (
    SELECT 1 FROM dbo.Contacts
    WHERE PhoneNumber = @PhoneNumber
      AND (@ExcludeId IS NULL OR Id <> @ExcludeId)
  ) THEN 1 ELSE 0 END AS BIT) AS [Exists];
END
GO
