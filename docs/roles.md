# User Roles and Access Control

Norruva uses a role-based access control (RBAC) system to manage user permissions and workflows.

| Role                  | Key Responsibilities                                                              |
| --------------------- | --------------------------------------------------------------------------------- |
| **Admin**             | Manages users, company settings, and system-wide compliance rules.                |
| **Supplier**          | Creates, updates, and manages Digital Product Passports for their products.       |
| **Auditor**           | Reviews pending product passports, verifies claims, and approves/rejects them.    |
| **Compliance Manager**| Monitors products flagged for non-compliance and oversees resolution workflows.   |
| **Manufacturer**      | Views product data, focusing on material composition and production details.      |
| **Service Provider**  | Accesses repair manuals and service-related information within a product passport.|
| **Recycler**          | Accesses end-of-life information, material composition, and recycling instructions.|
| **Developer**         | Manages API keys, webhooks, and integrations with external systems.               |
| **Business Analyst**  | Accesses aggregated data, analytics dashboards, and sustainability trend reports. |

---

## Workflow Example: New Product Creation

1.  A **Supplier** creates a new product passport and submits it for verification. The product status is `Draft` and verification status is `Pending`.
2.  An **Auditor** sees the new product in their queue. They review the data and approve it. The verification status changes to `Verified`.
3.  The **Supplier** can now change the product status to `Published`.
4.  If a scheduled check by the **System** later finds an issue, the verification status changes to `Failed`.
5.  A **Compliance Manager** is notified of the flagged product and works with the **Supplier** to resolve the issue.
