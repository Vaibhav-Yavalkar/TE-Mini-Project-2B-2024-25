# AI-Driven Review Management System

## Overview
The AI-driven review management system is designed to help businesses (e.g., restaurants, spas) manage their Google reviews efficiently. It includes web applications for both business owners and customers, integrating AI automation, Google My Business (GMB) API, and QR-based review collection.

---

## Web Application Workflow

### **1. Customer Review Submission Flow**
1. A business generates a unique **QR code** linked to their review collection page, integrated with Place ID
2. The customer scans the QR code, leading them to a web form
3. The system prompts the customer with an **AI-assisted review generator** (optional)
4. The customer submits their review
5. The system:
   - Posts the review to Google My Business (GMB) via API
   - Stores the review in the business dashboard
   - Sends a **thank you message** or incentive offer to the customer

### **2. AI-Powered Review Handling Flow**
1. The system monitors new reviews in real-time via GMB API
2. AI analyzes the sentiment and categorizes reviews as **positive, neutral, or negative**
3. AI generates an **automated response** based on sentiment and business tone
4. The owner can:
   - Approve or edit AI responses before posting
   - Let AI auto-post responses
   - Flag critical reviews for manual attention

### **3. Low-Rated Review Management Flow** (Premium Feature)
1. If a review is **below a set threshold (e.g., 3 stars)**, the system prompts the customer to provide private feedback
2. If the customer agrees:
   - The review is redirected to a private chat or feedback form
   - The business is notified to follow up
   - The customer is encouraged to update their review after resolution
3. If the customer declines, the review is posted as usual

### **4. Business Dashboard Flow**
1. The business logs into their dashboard
2. Features available:
   - **Review Monitoring**: View all Google reviews with filters
   - **AI Insights**: Analytics on review trends and business reputation
   - **Review Response Management**: Approve, edit, or auto-post AI responses
   - **QR Code Management**: Download QR codes (simplified)
   - **Customer Engagement**: Send follow-ups and offers
   - **Settings**: Adjust AI response behavior

### **5. Super Admin Dashboard Flow** (New Feature)
1. Super Admin Login provides access to main control panel
2. Features available:
   - **Business & User Insights**: Registration metrics, active users, revenue tracking
   - **Super Admin Control**:
     - Enable/disable business dashboards
     - View system usage infographics
     - Manage owner accounts
     - Access system logs

---

## System Design

### **1. Architecture Overview**
- **Frontend:** React.js for a dynamic and interactive UI.
- **Backend/Database:** Supabase.
- **AI Engine:** Deepseek AI for Chat feature and Custom NLP model for sentiment analysis & response generation.
- **GMB Integration:** Google My Business API for real-time review syncing and responses.
- **Authentication:** Supabase Auth.

### **2. Data Flow**
1. **Customer submits review** → Data is stored in DB → AI processes sentiment → Sent to GMB.
2. **AI generates response** → Business owner approves/edits → Response posted.
3. **Negative review flagged** → Redirected to private feedback → Owner follows up.
4. **Dashboard updates** → Business views insights & analytics → Engages customers.

### **3. Security & Compliance**
- **OAuth 2.0 Authentication** for secure API access.
- **Data Encryption** for sensitive information.
- **Rate Limiting & Firewalls** to prevent abuse and ensure reliability.

### **4. Database Schema**

#### Users Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| email | text | UNIQUE NOT NULL |
| full_name | text | |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now() |
| business_id | uuid | REFERENCES businesses(id) |
| role | text | CHECK (role IN ('admin', 'business_owner', 'staff')) |
| is_active | boolean | DEFAULT true |

#### Businesses Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| name | text | NOT NULL |
| gmb_location_id | text | UNIQUE |
| address | text | |
| phone | text | |
| email | text | |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now() |
| subscription_tier | text | DEFAULT 'basic' |
| settings | jsonb | |

#### Reviews Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| business_id | uuid | REFERENCES businesses(id) |
| customer_email | text | |
| rating | integer | CHECK (rating BETWEEN 1 AND 5) |
| content | text | |
| sentiment | text | CHECK (sentiment IN ('positive', 'neutral', 'negative')) |
| source | text | DEFAULT 'direct' |
| gmb_review_id | text | UNIQUE |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now() |
| is_private | boolean | DEFAULT false |

#### Review Responses Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| review_id | uuid | REFERENCES reviews(id) |
| content | text | NOT NULL |
| is_ai_generated | boolean | DEFAULT true |
| status | text | CHECK (status IN ('pending', 'approved', 'posted')) |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now() |
| posted_by | uuid | REFERENCES users(id) |

#### QR Codes Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| business_id | uuid | REFERENCES businesses(id) |
| name | text | |
| url | text | NOT NULL |
| scans_count | integer | DEFAULT 0 |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now() |
| expires_at | timestamp | |
| is_active | boolean | DEFAULT true |

#### Customer Engagement Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| business_id | uuid | REFERENCES businesses(id) |
| customer_email | text | NOT NULL |
| type | text | CHECK (type IN ('follow_up', 'incentive', 'thank_you')) |
| status | text | CHECK (status IN ('pending', 'sent', 'failed')) |
| content | text | |
| created_at | timestamp | DEFAULT now() |
| sent_at | timestamp | |

### **5. Project Structure**

---

## Key Features & Screens

### **1. Login Page**
- Secure authentication for business owners and super admins
- Role-based dashboard access
- Multi-factor authentication support

### **2. Customer Review Submission Screen**
- QR Code Scanner integration
- AI-Assisted review generator
- Rating selection (1-5 stars)
- Thank you message with incentives

### **3. AI-Powered Review Handling Screen**
- Real-time review monitoring
- Sentiment analysis indicators
- AI response generation and preview
- Manual override options

### **4. Business Dashboard Screen**
- Comprehensive review monitoring
- Analytics and insights
- Simplified QR code management
- Customer engagement tools
- Customizable settings

### **5. Super Admin Dashboard** (New Feature)
- **Infographics & Insights**:
  - Growth metrics tracking
  - Revenue and payment monitoring
  - Engagement analytics
- **Control Panel**:
  - Business dashboard management
  - Access control
  - System-wide settings

---

## Enhancements
- **AI Chatbot Integration:** Real-time chatbot for handling customer inquiries.
- **Automated Email & SMS Follow-Ups:** Nurture customer relationships.
- **Competitor Analysis Dashboard:** Compare reviews against competitors.
---

## Conclusion
This AI-driven review management system streamlines customer feedback collection, automates responses, and enhances business reputation management. With AI automation, businesses can improve engagement, address concerns proactively, and optimize their online presence effortlessly.
