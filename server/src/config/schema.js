export async function initSchema(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Blocks')
    CREATE TABLE Blocks (
      id NVARCHAR(100) NOT NULL PRIMARY KEY,
      name NVARCHAR(255) NOT NULL UNIQUE,
      createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
    CREATE TABLE Departments (
      id NVARCHAR(100) NOT NULL PRIMARY KEY,
      name NVARCHAR(255) NOT NULL UNIQUE,
      blockId NVARCHAR(100) NOT NULL,
      createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employees')
    CREATE TABLE Employees (
      code NVARCHAR(100) NOT NULL PRIMARY KEY,
      name NVARCHAR(255) NOT NULL,
      role NVARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
      departmentId NVARCHAR(100) NULL,
      blockId NVARCHAR(100) NULL,
      passwordHash NVARCHAR(255) NULL,
      passwordChangedAt DATETIME2 NULL,
      createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Groups')
    CREATE TABLE Groups (
      id NVARCHAR(100) NOT NULL PRIMARY KEY,
      name NVARCHAR(255) NOT NULL UNIQUE,
      color NVARCHAR(50) NOT NULL,
      isSystem BIT NOT NULL DEFAULT 0,
      checkInRequired BIT NOT NULL DEFAULT 1,
      blockIds NVARCHAR(MAX) NOT NULL DEFAULT '[]',
      createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Seats')
    CREATE TABLE Seats (
      seatId NVARCHAR(50) NOT NULL PRIMARY KEY,
      groupId NVARCHAR(100) NULL,
      employeeCode NVARCHAR(100) NULL,
      token NVARCHAR(255) NOT NULL,
      createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Seats_token' AND object_id = OBJECT_ID('Seats'))
      CREATE INDEX IX_Seats_token ON Seats(token);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Seats_employeeCode' AND object_id = OBJECT_ID('Seats'))
      CREATE INDEX IX_Seats_employeeCode ON Seats(employeeCode);

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EventSettings')
    CREATE TABLE EventSettings (
      [key] NVARCHAR(50) NOT NULL PRIMARY KEY,
      eventName NVARCHAR(255) NOT NULL,
      guestEnabled BIT NOT NULL DEFAULT 1,
      checkInOpen BIT NOT NULL DEFAULT 1,
      seatMode NVARCHAR(50) NOT NULL DEFAULT 'group',
      appUrl NVARCHAR(500) NOT NULL DEFAULT '',
      nameLocked BIT NOT NULL DEFAULT 0,
      startedAt DATETIME2 NULL,
      opensAt DATETIME2 NULL,
      closesAt DATETIME2 NULL,
      endHandledAt DATETIME2 NULL,
      archivedId NVARCHAR(100) NULL,
      createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      updatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Attendances')
    CREATE TABLE Attendances (
      employeeCode NVARCHAR(100) NOT NULL PRIMARY KEY,
      seatId NVARCHAR(50) NOT NULL DEFAULT '',
      method NVARCHAR(20) NOT NULL DEFAULT 'SELF',
      checkedInBy NVARCHAR(100) NOT NULL DEFAULT '',
      reason NVARCHAR(500) NOT NULL DEFAULT '',
      checkedInAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
    CREATE TABLE AuditLogs (
      id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      action NVARCHAR(100) NOT NULL,
      actorCode NVARCHAR(100) NULL,
      actorRole NVARCHAR(50) NULL,
      detail NVARCHAR(300) NOT NULL DEFAULT '',
      createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLogs_action' AND object_id = OBJECT_ID('AuditLogs'))
      CREATE INDEX IX_AuditLogs_action ON AuditLogs(action);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AuditLogs_createdAt' AND object_id = OBJECT_ID('AuditLogs'))
      CREATE INDEX IX_AuditLogs_createdAt ON AuditLogs(createdAt DESC);

    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EventArchives')
    CREATE TABLE EventArchives (
      id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
      eventName NVARCHAR(255) NOT NULL,
      startedAt DATETIME2 NULL,
      archivedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      archivedBy NVARCHAR(100) NOT NULL DEFAULT '',
      cause NVARCHAR(50) NOT NULL,
      summary NVARCHAR(MAX) NOT NULL DEFAULT '{}',
      rows NVARCHAR(MAX) NOT NULL DEFAULT '[]'
    );
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EventArchives_archivedAt' AND object_id = OBJECT_ID('EventArchives'))
      CREATE INDEX IX_EventArchives_archivedAt ON EventArchives(archivedAt DESC);
  `);
}
