// services/api.js -- dashboard
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://apiphp.dsofthub.com/jobconsultancy/job.php';

class Service {
    async makeRequest(data) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
            }

            const result = await response.json()

            // Handle various success flags (success: true, status: 'success', etc)
            if (result.error) {
                throw new Error(result.error)
            }

            return result
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            const { email, password, role } = credentials;

            const result = await this.makeRequest({
                action: 'login',
                data: { email, password, role }
            });

            if (result.status === 'success' && result.user) {
                return {
                    success: true,
                    user: {
                        id: result.user.id,
                        userId: result.user.user_id,
                        role: result.user.role,
                        name: result.user.name,
                        email: result.user.email,
                        created_at: result.user.created_at,
                        auto_approve_jobs: result.user.auto_approve_jobs
                    }
                };
            }

            throw new Error(result.error || 'Invalid credentials');

        } catch (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    async getData(table, where = {}, order_by = {}, joins = []) {
        try {
            return await this.makeRequest({ action: 'get', table, where, order_by, joins })
        } catch (error) {
            throw new Error(`Failed to fetch data: ${error.message}`)
        }
    }

    async insertData(table, data) {
        try {
            return await this.makeRequest({ action: 'insert', table, data })
        } catch (error) {
            throw new Error(`Failed to insert data: ${error.message}`)
        }
    }

    async updateData(table, where, data) {
        try {
            return await this.makeRequest({ action: 'update', table, data, where })
        } catch (error) {
            throw new Error(`Failed to update data: ${error.message}`)
        }
    }

    async deleteData(table, where, permanent = false) {
        try {
            return await this.makeRequest({ action: 'delete', table, where, permanent })
        } catch (error) {
            throw new Error(`Failed to delete data: ${error.message}`)
        }
    }

    async resetPassword(email, newPassword) {
        try {
            return await this.updateData('users', { email }, { password: newPassword });
        } catch (error) {
            console.error("Password update failed:", error);
            throw error;
        }
    }
}

export const allService = new Service()
