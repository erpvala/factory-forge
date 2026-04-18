# Factory Forge Database ERD

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Entities
    Users {
        string _id PK
        string name
        string email UK
        string phone
        string passwordHash
        string role FK
        string status
        datetime createdAt
        datetime updatedAt
    }
    
    Applications {
        string _id PK
        string userId FK
        string roleType
        object data
        string status
        datetime createdAt
        datetime updatedAt
    }
    
    %% Financial Entities
    Payments {
        string _id PK
        string userId FK
        number amount
        string currency
        string status
        string paymentMethod
        string transactionId UK
        string description
        object metadata
        datetime createdAt
        datetime updatedAt
    }
    
    Licenses {
        string _id PK
        string userId FK
        string productId
        string licenseKey UK
        string type
        string status
        datetime expiresAt
        array features
        object metadata
        datetime createdAt
        datetime updatedAt
    }
    
    %% Business Entities
    Tasks {
        string _id PK
        string title
        string description
        string assignedTo FK
        string assignedBy FK
        string status
        string priority
        string type
        array tags
        datetime dueDate
        datetime completedAt
        object metadata
        datetime createdAt
        datetime updatedAt
    }
    
    Leads {
        string _id PK
        string name
        string email UK
        string phone
        string company
        string source
        string status
        string assignedTo FK
        number value
        string notes
        object metadata
        datetime createdAt
        datetime updatedAt
    }
    
    %% System Entities
    AuditLogs {
        string _id PK
        string userId FK
        string action
        string resource
        string resourceId
        object details
        string ipAddress
        string userAgent
        datetime timestamp
    }
    
    EventBus {
        string _id PK
        string eventType
        string source
        object data
        string userId FK
        string sessionId
        boolean processed
        datetime processedAt
        string error
        datetime timestamp
    }
    
    SystemMetrics {
        string _id PK
        string metricType
        number value
        string unit
        object tags
        datetime timestamp
    }
    
    %% Relationships
    Users ||--o{ Applications : "submits"
    Users ||--o{ Payments : "makes"
    Users ||--o{ Licenses : "owns"
    Users ||--o{ Tasks : "assigned_to"
    Users ||--o{ Tasks : "assigned_by"
    Users ||--o{ Leads : "assigned_to"
    Users ||--o{ AuditLogs : "performs"
    Users ||--o{ EventBus : "triggers"
    
    %% Additional relationship notes
    Applications {
        note: "Status: PENDING/APPROVED/REJECTED"
        note: "RoleType: developer/reseller/franchise/influencer/job"
    }
    
    Users {
        note: "Role: developer/reseller/franchise/influencer/boss"
        note: "Status: PENDING/ACTIVE/REJECTED"
    }
    
    Payments {
        note: "Status: PENDING/COMPLETED/FAILED/REFUNDED"
        note: "Amount: in cents (e.g., 24900 for $249)"
    }
    
    Licenses {
        note: "Type: TRIAL/STANDARD/PREMIUM/ENTERPRISE"
        note: "Status: ACTIVE/EXPIRED/SUSPENDED/CANCELLED"
    }
    
    Tasks {
        note: "Status: TODO/IN_PROGRESS/REVIEW/COMPLETED/CANCELLED"
        note: "Priority: LOW/MEDIUM/HIGH/URGENT"
        note: "Type: BUG/FEATURE/IMPROVEMENT/TASK/EPIC"
    }
    
    Leads {
        note: "Status: NEW/CONTACTED/QUALIFIED/CONVERTED/LOST"
        note: "Source: website/referral/direct/social"
    }
    
    SystemMetrics {
        note: "MetricType: CPU/MEMORY/DISK/NETWORK/USERS/REVENUE/ERRORS/PERFORMANCE"
    }
```

## Database Schema Overview

### Core Tables

#### Users
- **Purpose**: Central user management and authentication
- **Key Fields**: email (unique), role, status
- **Roles**: developer, reseller, franchise, influencer, boss
- **Status**: PENDING, ACTIVE, REJECTED

#### Applications
- **Purpose**: Track user applications for various roles
- **Relationship**: Many-to-one with Users
- **Data**: JSON object containing form data
- **Flow**: PENDING → APPROVED/REJECTED

### Financial Tables

#### Payments
- **Purpose**: Track all financial transactions
- **Key Fields**: transactionId (unique), amount, status
- **Amount**: Stored in cents (e.g., 24900 = $249)
- **Status**: PENDING → COMPLETED/FAILED/REFUNDED

#### Licenses
- **Purpose**: Manage software licenses
- **Key Fields**: licenseKey (unique), expiresAt
- **Types**: TRIAL, STANDARD, PREMIUM, ENTERPRISE
- **Status**: ACTIVE, EXPIRED, SUSPENDED, CANCELLED

### Business Tables

#### Tasks
- **Purpose**: Task management and assignment
- **Relationships**: assignedTo (User), assignedBy (User)
- **Priority**: LOW, MEDIUM, HIGH, URGENT
- **Types**: BUG, FEATURE, IMPROVEMENT, TASK, EPIC

#### Leads
- **Purpose**: Lead management and conversion tracking
- **Key Fields**: email (unique), status, value
- **Status**: NEW → CONTACTED → QUALIFIED → CONVERTED/LOST
- **Assignment**: Optional assignment to Users

### System Tables

#### AuditLogs
- **Purpose**: Track all system actions for compliance
- **Relationship**: Optional User relationship
- **Data**: action, resource, resourceId, details
- **Metadata**: ipAddress, userAgent, timestamp

#### EventBus
- **Purpose**: Event-driven architecture backbone
- **Processing**: processed flag with processedAt timestamp
- **Error Handling**: error field for failed events
- **Relationship**: Optional User relationship

#### SystemMetrics
- **Purpose**: Performance and business metrics
- **Types**: CPU, MEMORY, DISK, NETWORK, USERS, REVENUE, ERRORS, PERFORMANCE
- **Structure**: value, unit, tags, timestamp
- **Usage**: Real-time monitoring and analytics

## Key Relationships

1. **User → Applications**: One user can submit multiple applications
2. **User → Payments**: One user can make multiple payments
3. **User → Licenses**: One user can own multiple licenses
4. **User → Tasks**: Many-to-many (assigned_to and assigned_by)
5. **User → Leads**: One user can be assigned multiple leads
6. **User → AuditLogs**: One user can perform multiple actions
7. **User → EventBus**: One user can trigger multiple events

## Data Flow

1. **Application Flow**: User → Application → Approval → User.role update
2. **Payment Flow**: User → Payment → License generation
3. **Task Flow**: User assigned_by → Task → User assigned_to
4. **Lead Flow**: Lead → User assigned_to → Conversion → Payment
5. **Audit Flow**: Any action → AuditLog → Compliance tracking
6. **Event Flow**: System actions → EventBus → Processing

## Performance Considerations

- **Indexes**: All foreign keys and frequently queried fields have indexes
- **Timestamps**: Most tables include createdAt/updatedAt for auditing
- **Soft Deletes**: Implemented via status fields instead of hard deletes
- **Data Types**: Optimized for storage (e.g., amounts in cents)
- **Relationships**: Proper foreign key relationships with referential integrity

## Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **Unique Constraints**: Email, transactionId, licenseKey
- **Audit Trail**: Complete audit log of all system actions
- **Event Tracking**: Comprehensive event bus for security monitoring
- **Role-Based Access**: User roles determine system access
