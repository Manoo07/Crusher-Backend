# CrusherMate API Response Structures

This document outlines the response structures for all API endpoints as defined in the Swagger/OpenAPI specification.

## Base Response Schemas

### StandardSuccess

```json
{
  "success": true,
  "message": "Operation successful",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {}
}
```

### ErrorResponse

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description",
  "code": "APPLICATION_ERROR_CODE",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### Pagination

```json
{
  "currentPage": 1,
  "totalPages": 5,
  "totalItems": 50,
  "pageSize": 10
}
```

---

## Health Endpoints

### GET /health

**Response (200):**

```json
{
  "success": true,
  "message": "CrusherMate API Server is running!",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### GET /ping

**Response (200):**

```json
{
  "success": true,
  "message": "CrusherMate API Server is running!",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### GET /api/health

**Response (200):**

```json
{
  "success": true,
  "message": "Operation successful",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "status": "healthy",
    "uptime": "2h 30m 15s",
    "database": {
      "status": "connected",
      "responseTime": "5ms"
    },
    "environment": "development",
    "version": "1.0.0"
  }
}
```

### GET /api/health/db

**Response (200):**

```json
{
  "success": true,
  "message": "Operation successful",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "status": "connected",
    "database": "crusher_db",
    "host": "localhost:5432"
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/register

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6891e7637f59e26c132beee4",
      "username": "suresh_owner",
      "role": "owner",
      "organization": {
        "_id": "6891e7647f59e26c132beeec",
        "name": "Suresh Crusher",
        "owner": "6891e7637f59e26c132beee4",
        "members": ["6891e7637f59e26c132beee4", "6891e7657f59e26c132bef04"],
        "createdAt": "2025-08-05T11:13:40.156Z",
        "updatedAt": "2025-08-05T13:04:25.958Z"
      },
      "organizationName": "Suresh Crusher",
      "lastLogin": "2025-08-09T12:30:57.017Z",
      "isActive": true
    }
  }
}
```

### POST /api/auth/login

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "timestamp": "2025-08-09T12:30:57.050Z",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6891e7637f59e26c132beee4",
      "username": "suresh_owner",
      "role": "owner",
      "organization": {
        "_id": "6891e7647f59e26c132beeec",
        "name": "Suresh Crusher",
        "owner": "6891e7637f59e26c132beee4",
        "members": ["6891e7637f59e26c132beee4", "6891e7657f59e26c132bef04"],
        "createdAt": "2025-08-05T11:13:40.156Z",
        "updatedAt": "2025-08-05T13:04:25.958Z"
      },
      "organizationName": "Suresh Crusher",
      "lastLogin": "2025-08-09T12:30:57.017Z",
      "isActive": true
    }
  }
}
```

### GET /api/auth/verify-token

**Response (200):**

```json
{
  "success": true,
  "message": "Token is valid",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6891e7637f59e26c132beee4",
      "username": "suresh_owner",
      "role": "owner",
      "organization": "6891e7647f59e26c132beeec",
      "organizationName": "Suresh Crusher",
      "lastLogin": "2025-08-09T12:30:57.017Z",
      "isActive": true
    }
  }
}
```

### POST /api/auth/logout

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {}
}
```

### GET /api/auth/profile

**Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6891e7637f59e26c132beee4",
      "username": "suresh_owner",
      "role": "owner",
      "organization": "6891e7647f59e26c132beeec",
      "organizationName": "Suresh Crusher",
      "lastLogin": "2025-08-09T12:30:57.017Z",
      "isActive": true
    }
  }
}
```

---

## Users Endpoints

### GET /api/users/profile

**Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6891e7637f59e26c132beee4",
      "username": "suresh_owner",
      "role": "owner",
      "organization": "6891e7647f59e26c132beeec",
      "organizationName": "Suresh Crusher",
      "lastLogin": "2025-08-09T12:30:57.017Z",
      "isActive": true
    }
  }
}
```

### PUT /api/users/profile

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6891e7637f59e26c132beee4",
      "username": "suresh_owner_updated",
      "role": "owner",
      "organization": "6891e7647f59e26c132beeec",
      "organizationName": "Suresh Crusher",
      "lastLogin": "2025-08-09T12:30:57.017Z",
      "isActive": true
    }
  }
}
```

### GET /api/users

**Response (200):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "users": [
      {
        "id": "6891e7637f59e26c132beee4",
        "username": "suresh_owner",
        "role": "owner",
        "organization": "6891e7647f59e26c132beeec",
        "organizationName": "Suresh Crusher",
        "lastLogin": "2025-08-09T12:30:57.017Z",
        "isActive": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "pageSize": 10
    }
  }
}
```

### GET /api/users/{id}

**Response (200):**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "user": {
      "id": "6891e7637f59e26c132beee4",
      "username": "suresh_owner",
      "role": "owner",
      "organization": "6891e7647f59e26c132beeec",
      "organizationName": "Suresh Crusher",
      "lastLogin": "2025-08-09T12:30:57.017Z",
      "isActive": true
    }
  }
}
```

### DELETE /api/users/{id}

**Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {}
}
```

### PUT /api/users/{id}/status

**Response (200):**

```json
{
  "success": true,
  "message": "User status updated successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {}
}
```

---

## Truck Entries Endpoints

### GET /api/truck-entries

**Response (200):**

```json
{
  "success": true,
  "message": "Truck entries retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "truckEntries": [
      {
        "_id": "entry123",
        "organization": "org456",
        "userId": {
          "_id": "user789",
          "username": "john_doe"
        },
        "truckNumber": "TN-01-AB-1234",
        "truckName": "Ashok Leyland",
        "entryType": "Sales",
        "materialType": "20mm Stone",
        "units": 100,
        "ratePerUnit": 45,
        "totalAmount": 4500,
        "truckImage": "truck_image_url",
        "entryDate": "2025-08-10",
        "entryTime": "09:30",
        "status": "active",
        "notes": "Regular delivery",
        "createdAt": "2025-08-10T07:28:04.215Z",
        "updatedAt": "2025-08-10T07:28:04.215Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "pageSize": 10
    }
  }
}
```

### POST /api/truck-entries

**Response (201):**

```json
{
  "success": true,
  "message": "Truck entry created successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "truckEntry": {
      "_id": "entry123",
      "organization": "org456",
      "userId": {
        "_id": "user789",
        "username": "john_doe"
      },
      "truckNumber": "TN-01-AB-1234",
      "truckName": "Ashok Leyland",
      "entryType": "Sales",
      "materialType": "20mm Stone",
      "units": 100,
      "ratePerUnit": 45,
      "totalAmount": 4500,
      "truckImage": "truck_image_url",
      "entryDate": "2025-08-10",
      "entryTime": "09:30",
      "status": "active",
      "notes": "Regular delivery",
      "createdAt": "2025-08-10T07:28:04.215Z",
      "updatedAt": "2025-08-10T07:28:04.215Z"
    }
  }
}
```

### GET /api/truck-entries/summary

**Response (200):**

```json
{
  "success": true,
  "message": "Summary retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "totalSales": 150000,
    "totalRawStone": 75000,
    "totalOtherExpenses": 25000,
    "totalExpenses": 100000,
    "netProfit": 50000,
    "salesCount": 10,
    "rawStoneCount": 5,
    "otherExpensesCount": 8,
    "totalEntries": 15
  }
}
```

### GET /api/truck-entries/{id}

**Response (200):**

```json
{
  "success": true,
  "message": "Truck entry retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "truckEntry": {
      "_id": "entry123",
      "organization": "org456",
      "userId": {
        "_id": "user789",
        "username": "john_doe"
      },
      "truckNumber": "TN-01-AB-1234",
      "truckName": "Ashok Leyland",
      "entryType": "Sales",
      "materialType": "20mm Stone",
      "units": 100,
      "ratePerUnit": 45,
      "totalAmount": 4500,
      "truckImage": "truck_image_url",
      "entryDate": "2025-08-10",
      "entryTime": "09:30",
      "status": "active",
      "notes": "Regular delivery",
      "createdAt": "2025-08-10T07:28:04.215Z",
      "updatedAt": "2025-08-10T07:28:04.215Z"
    }
  }
}
```

### PUT /api/truck-entries/{id}

**Response (200):**

```json
{
  "success": true,
  "message": "Truck entry updated successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "truckEntry": {
      "_id": "entry123",
      "organization": "org456",
      "userId": {
        "_id": "user789",
        "username": "john_doe"
      },
      "truckNumber": "TN-01-AB-1234",
      "truckName": "Ashok Leyland",
      "entryType": "Sales",
      "materialType": "20mm Stone",
      "units": 120,
      "ratePerUnit": 50,
      "totalAmount": 6000,
      "truckImage": "truck_image_url",
      "entryDate": "2025-08-10",
      "entryTime": "09:30",
      "status": "active",
      "notes": "Updated delivery",
      "createdAt": "2025-08-10T07:28:04.215Z",
      "updatedAt": "2025-08-10T08:15:30.500Z"
    }
  }
}
```

### DELETE /api/truck-entries/{id}

**Response (200):**

```json
{
  "success": true,
  "message": "Truck entry deleted successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {}
}
```

---

## Material Rates Endpoints

### GET /api/material-rates

**Response (200):**

```json
{
  "success": true,
  "message": "Material rates retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "materialRates": [
      {
        "_id": "rate123",
        "materialType": "20mm Stone",
        "currentRate": 45,
        "previousRate": 40,
        "effectiveDate": "2025-08-01T00:00:00.000Z",
        "updatedBy": "user123"
      },
      {
        "_id": "rate124",
        "materialType": "40mm Stone",
        "currentRate": 50,
        "previousRate": 48,
        "effectiveDate": "2025-08-01T00:00:00.000Z",
        "updatedBy": "user123"
      }
    ]
  }
}
```

### POST /api/material-rates

**Response (200):**

```json
{
  "success": true,
  "message": "Material rate updated successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "materialRates": [
      {
        "_id": "rate123",
        "materialType": "20mm Stone",
        "currentRate": 50,
        "previousRate": 45,
        "effectiveDate": "2025-08-10T07:28:04.215Z",
        "updatedBy": "user123"
      }
    ]
  }
}
```

---

## Configuration Endpoints

### GET /api/config/app

**Response (200):**

```json
{
  "success": true,
  "message": "App configuration retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "config": {
      "appName": "CrusherMate",
      "version": "1.0.0",
      "features": {
        "imageUpload": true,
        "reportGeneration": true,
        "multiOrganization": true
      },
      "limits": {
        "maxTruckEntries": 1000,
        "maxUsers": 50
      }
    }
  }
}
```

### GET /api/config/rates

**Response (200):**

```json
{
  "success": true,
  "message": "Current rates retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "rates": [
      {
        "materialType": "20mm Stone",
        "currentRate": 45,
        "lastUpdated": "2025-08-01T00:00:00.000Z"
      },
      {
        "materialType": "40mm Stone",
        "currentRate": 50,
        "lastUpdated": "2025-08-01T00:00:00.000Z"
      }
    ],
    "previewUnits": 100
  }
}
```

### POST /api/config/calculate

**Response (200):**

```json
{
  "success": true,
  "message": "Calculation completed successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "calculation": {
      "units": 100,
      "ratePerUnit": 45,
      "totalAmount": 4500
    },
    "formatted": {
      "units": "100 units",
      "ratePerUnit": "₹45.00 per unit",
      "totalAmount": "₹4,500.00"
    }
  }
}
```

### POST /api/config/validate

**Response (200):**

```json
{
  "success": true,
  "message": "Validation completed successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": ["Truck number format should follow standard pattern"],
    "validatedData": {
      "truckNumber": "TN-01-AB-1234",
      "entryType": "Sales",
      "materialType": "20mm Stone",
      "units": 100,
      "ratePerUnit": 45,
      "totalAmount": 4500
    }
  }
}
```

---

## Other Expenses Endpoints

### GET /api/expenses

**Response (200):**

```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "expenses": [
      {
        "_id": "expense123",
        "organization": "org456",
        "user": "user789",
        "expensesName": "Fuel Cost",
        "amount": 5000,
        "others": "Diesel for crusher",
        "notes": "Monthly fuel expense",
        "date": "2025-08-10",
        "isActive": true,
        "createdAt": "2025-08-10T07:28:04.215Z",
        "updatedAt": "2025-08-10T07:28:04.215Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 5,
      "pageSize": 10
    }
  }
}
```

### POST /api/expenses

**Response (201):**

```json
{
  "success": true,
  "message": "Expense created successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "expense": {
      "_id": "expense123",
      "organization": "org456",
      "user": "user789",
      "expensesName": "Fuel Cost",
      "amount": 5000,
      "others": "Diesel for crusher",
      "notes": "Monthly fuel expense",
      "date": "2025-08-10",
      "isActive": true,
      "createdAt": "2025-08-10T07:28:04.215Z",
      "updatedAt": "2025-08-10T07:28:04.215Z"
    }
  }
}
```

### GET /api/expenses/summary

**Response (200):**

```json
{
  "success": true,
  "message": "Expense summary retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "totalAmount": 25000,
    "totalCount": 15
  }
}
```

### GET /api/expenses/{id}

**Response (200):**

```json
{
  "success": true,
  "message": "Expense retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "expense": {
      "_id": "expense123",
      "organization": "org456",
      "user": "user789",
      "expensesName": "Fuel Cost",
      "amount": 5000,
      "others": "Diesel for crusher",
      "notes": "Monthly fuel expense",
      "date": "2025-08-10",
      "isActive": true,
      "createdAt": "2025-08-10T07:28:04.215Z",
      "updatedAt": "2025-08-10T07:28:04.215Z"
    }
  }
}
```

### PUT /api/expenses/{id}

**Response (200):**

```json
{
  "success": true,
  "message": "Expense updated successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "expense": {
      "_id": "expense123",
      "organization": "org456",
      "user": "user789",
      "expensesName": "Fuel Cost Updated",
      "amount": 5500,
      "others": "Diesel for crusher - premium",
      "notes": "Monthly fuel expense - updated",
      "date": "2025-08-10",
      "isActive": true,
      "createdAt": "2025-08-10T07:28:04.215Z",
      "updatedAt": "2025-08-10T08:15:30.500Z"
    }
  }
}
```

### DELETE /api/expenses/{id}

**Response (200):**

```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {}
}
```

---

## Reports Endpoints

### GET /api/reports/templates

**Response (200):**

```json
{
  "success": true,
  "message": "Report templates retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "templates": [
      {
        "id": "sales-report",
        "name": "Sales Report",
        "description": "Complete sales analysis with truck entries",
        "formats": ["PDF", "Excel", "CSV"]
      },
      {
        "id": "expense-report",
        "name": "Expense Report",
        "description": "Detailed expense breakdown",
        "formats": ["PDF", "Excel"]
      }
    ]
  }
}
```

### GET /api/reports/data

**Response (200):**

```json
{
  "success": true,
  "message": "Report data retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "reportData": {
      "reportType": "sales-report",
      "dateRange": {
        "from": "2025-08-01",
        "to": "2025-08-10"
      },
      "summary": {
        "totalSales": 150000,
        "totalEntries": 25,
        "averagePerEntry": 6000
      },
      "entries": [
        {
          "date": "2025-08-10",
          "truckNumber": "TN-01-AB-1234",
          "materialType": "20mm Stone",
          "amount": 4500
        }
      ]
    }
  }
}
```

### POST /api/reports/export

**Response (200):**

```json
{
  "success": true,
  "message": "Export generated successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "downloadUrl": "/api/reports/download/token123",
    "fileName": "sales-report-2025-08-10.pdf",
    "fileSize": "2.5MB",
    "expiresAt": "2025-08-10T08:28:04.215Z"
  }
}
```

### GET /api/reports/export

**Response (200):**

```json
{
  "success": true,
  "message": "Export generated successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "downloadUrl": "/api/reports/download/token123",
    "fileName": "sales-report-2025-08-10.pdf",
    "fileSize": "2.5MB",
    "expiresAt": "2025-08-10T08:28:04.215Z"
  }
}
```

### POST /api/reports/browser-download

**Response (200):**

```json
{
  "success": true,
  "message": "Download token issued successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "downloadUrl": "/api/reports/download/token123",
    "fileName": "sales-report-2025-08-10.pdf",
    "fileSize": "2.5MB",
    "expiresAt": "2025-08-10T08:28:04.215Z"
  }
}
```

### GET /api/reports/download/{token}

**Response (200):**

- Returns the actual file as binary data (PDF, Excel, CSV)
- Content-Type varies based on file format
- Content-Disposition: attachment; filename="report.pdf"

### GET /api/reports/test-data

**Response (200):**

```json
{
  "success": true,
  "message": "Test data retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "testData": {
      "users": 5,
      "organizations": 2,
      "truckEntries": 25,
      "expenses": 15
    }
  }
}
```

---

## Organizations Endpoints

### GET /api/organizations

**Response (200):**

```json
{
  "success": true,
  "message": "Organizations retrieved successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "organizations": [
      {
        "_id": "6891e7647f59e26c132beeec",
        "name": "Suresh Crusher",
        "owner": "6891e7637f59e26c132beee4",
        "members": ["6891e7637f59e26c132beee4", "6891e7657f59e26c132bef04"],
        "createdAt": "2025-08-05T11:13:40.156Z",
        "updatedAt": "2025-08-05T13:04:25.958Z"
      }
    ]
  }
}
```

### POST /api/organizations

**Response (201):**

```json
{
  "success": true,
  "message": "Organization created successfully",
  "timestamp": "2025-08-10T07:28:04.215Z",
  "data": {
    "organization": {
      "_id": "6891e7647f59e26c132beeec",
      "name": "New Crusher Company",
      "owner": "6891e7637f59e26c132beee4",
      "members": ["6891e7637f59e26c132beee4"],
      "createdAt": "2025-08-10T07:28:04.215Z",
      "updatedAt": "2025-08-10T07:28:04.215Z"
    }
  }
}
```

---

## Common Error Responses

### 400 - Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### 401 - Unauthorized Error

```json
{
  "success": false,
  "message": "Unauthorized access",
  "error": "Missing or invalid authentication token",
  "code": "UNAUTHORIZED",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### 403 - Forbidden Error

```json
{
  "success": false,
  "message": "Forbidden",
  "error": "Insufficient permissions to access this resource",
  "code": "FORBIDDEN",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### 404 - Not Found Error

```json
{
  "success": false,
  "message": "Resource not found",
  "error": "The requested resource could not be found",
  "code": "NOT_FOUND",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### 409 - Conflict Error (for organization creation)

```json
{
  "success": false,
  "message": "Organization name already exists",
  "error": "An organization with this name already exists",
  "code": "DUPLICATE_ORGANIZATION",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### 500 - Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "An unexpected error occurred",
  "code": "INTERNAL_SERVER_ERROR",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

### 503 - Service Unavailable (for database health)

```json
{
  "success": false,
  "message": "Database connection failed",
  "error": "Unable to connect to the database",
  "code": "DATABASE_UNAVAILABLE",
  "timestamp": "2025-08-10T07:28:04.215Z"
}
```

---

## Notes

1. **Authentication**: All endpoints except `/health`, `/ping`, `/api/auth/register`, and `/api/auth/login` require a Bearer JWT token in the Authorization header.

2. **Timestamps**: All timestamps are in ISO 8601 format (UTC).

3. **Pagination**: List endpoints support pagination with `page` and `limit` query parameters.

4. **Organization Isolation**: All data operations are scoped to the user's organization.

5. **Role-based Access**: Some endpoints are restricted to users with "owner" role.

6. **File Uploads**: Truck entry creation/update supports multipart/form-data for image uploads.

7. **Date Formats**: Date fields use YYYY-MM-DD format, datetime fields use ISO 8601.

8. **Error Consistency**: All error responses follow the same ErrorResponse schema structure.
