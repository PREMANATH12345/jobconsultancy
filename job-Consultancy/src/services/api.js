// services/api.js -- website 
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

    async formSubmission(data, formType = 'contact') {
        try {
            return await this.makeRequest({
                action: 'form_submission',
                table: 'form_submission',
                data: data,
                formType: formType,
            })
        } catch (error) {
            throw new Error(`Failed to submit contact form: ${error.message}`)
        }
    }

    async submitContactForm(contactData) {
        try {
            return await this.makeRequest({
                action: 'contact_submission',
                table: 'contact_submissions',
                data: contactData,
            })
        } catch (error) {
            throw new Error(`Failed to submit contact form: ${error.message}`)
        }
    }

    async sendOTP(email, name, type = 'register', userData = null) {
        try {
            const requestData = {
                action: 'send_otp',
                data: { email, name, type },
            }
            if (userData && type === 'register') {
                requestData.user_data = userData
            }
            return await this.makeRequest(requestData)
        } catch (error) {
            throw new Error(`Failed to send OTP: ${error.message}`)
        }
    }

    async verifyOTP(email, otp, type = 'register') {
        try {
            return await this.makeRequest({
                action: 'verify_otp',
                data: { email, otp, type },
            })
        } catch (error) {
            throw new Error(`OTP verification failed: ${error.message}`)
        }
    }

    async completeRegistration(userData) {
        try {
            const result = await this.makeRequest({
                action: 'complete_registration',
                data: userData,
            })
            if (result.status === 'success') {
                return { success: true, userId: userData.user_id, insertId: result.insertId }
            }
            throw new Error(result.error || 'Registration failed')
        } catch (error) {
            throw new Error(`Registration failed: ${error.message}`)
        }
    }

    async verifyPassword(email, password) {
        try {
            return await this.makeRequest({
                action: 'verify_password',
                data: { email, password, role: 'user' },
            })
        } catch (error) {
            throw new Error(`Password verification failed: ${error.message}`)
        }
    }

    async login(credentials) {
        try {
            const { email, password, role } = credentials;

            // Call the backend login action directly
            const result = await this.makeRequest({
                action: 'login',
                data: { email, password, role }
            });

            // Check if login was successful
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

    async getUserProfile(userId, role) {
        try {
            const result = await this.makeRequest({
                action: 'get',
                table: 'users',
                where: { user_id: userId, role: role },
            })
            return result[0] || null
        } catch (error) {
            throw new Error(`Failed to get user profile: ${error.message}`)
        }
    }

    async forgotPassword(email) {
        try {
            return await this.makeRequest({
                action: 'send_otp',
                data: { email: email, type: 'reset' }
            })
        } catch (error) {
            throw new Error(`Failed to send password reset OTP: ${error.message}`)
        }
    }

    async resetPassword(email, newPassword) {
        try {
            // Reverting to 'update' action as 'reset_password' is not supported by the backend
            const result = await this.makeRequest({
                action: 'update',
                table: 'users',
                data: { password: newPassword },
                where: { email: email }
            })
            return { success: true }
        } catch (error) {
            console.error("Password update failed:", error);
            throw error;
        }
    }

    async createRazorpayOrder(planData) {
        return await this.makeRequest({
            action: 'create_razorpay_order',
            data: planData
        });
    }

    async verifyRazorpayPayment(paymentData) {
        return await this.makeRequest({
            action: 'verify_razorpay_payment',
            data: paymentData
        });
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

    async uploadFile(file, options = {}) {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('action', 'upload_file')
            formData.append('upload_options', JSON.stringify(options))

            const response = await fetch(API_URL, { method: 'POST', body: formData })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            if (result.error) throw new Error(result.error)
            return result
        } catch (error) {
            throw new Error(`File upload failed: ${error.message}`)
        }
    }

    async uploadMultipleFiles(files, options = {}) {
        try {
            const formData = new FormData()
            files.forEach(file => formData.append('files[]', file))
            formData.append('action', 'upload_files')
            formData.append('upload_options', JSON.stringify(options))

            const response = await fetch(API_URL, { method: 'POST', body: formData })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            if (result.error) throw new Error(result.error)
            return result
        } catch (error) {
            throw new Error(`Files upload failed: ${error.message}`)
        }
    }

    async deleteFile(filePath) {
        try {
            let pathToDelete = filePath
            if (filePath.includes('/uploads/')) {
                const parts = filePath.split('/uploads/')
                pathToDelete = parts[parts.length - 1]
            }
            if (pathToDelete.startsWith('/uploads/')) {
                pathToDelete = pathToDelete.substring(9)
            }

            return await this.makeRequest({ action: 'delete_file', file_path: pathToDelete })
        } catch (error) {
            throw new Error(`File deletion failed: ${error.message}`)
        }
    }

    async updateFile(fileUrl, newFile, options = {}) {
        try {
            let filename = null
            if (fileUrl.includes('/')) {
                const parts = fileUrl.split('/')
                filename = parts[parts.length - 1].split('?')[0]
            } else {
                filename = fileUrl
            }

            const formData = new FormData()
            formData.append('file', newFile)
            formData.append('action', 'update_file')
            formData.append('filename', filename)
            if (options.subdirectory) formData.append('subdirectory', options.subdirectory)

            const response = await fetch(API_URL, { method: 'POST', body: formData })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            if (result.error) throw new Error(result.error)
            return result
        } catch (error) {
            throw new Error(`File update failed: ${error.message}`)
        }
    }

    async getFile(options = {}) {
        try {
            const formData = new FormData()
            formData.append('action', 'get_file')
            Object.keys(options).forEach(key => formData.append(key, options[key]))

            const response = await fetch(API_URL, { method: 'POST', body: formData })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            if (result.error) throw new Error(result.error)
            return result
        } catch (error) {
            throw new Error(`Get file failed: ${error.message}`)
        }
    }

    extractFilenameFromUrl(url) {
        if (!url) return null
        try {
            const cleanUrl = url.split('?')[0]
            const parts = cleanUrl.split('/')
            return parts[parts.length - 1] || null
        } catch (error) {
            return null
        }
    }

    async handleFileOperation(type, file, options = {}, currentUrl = null) {
        if (type === 'create') return await this.uploadFile(file, options)
        if (type === 'update') return await this.updateFile(currentUrl, file, options)
        throw new Error('Invalid operation type')
    }

    async findNextTestimonialId() {
        try {
            const response = await this.getFile({ subdirectory: 'uploads/testimonials', exclude_backups: true })
            if (!response?.files) return 1
            const ids = response.files.map(f => {
                const match = f.name.match(/(?:thumb|testimonial)-(\d+)/)
                return match ? parseInt(match[1]) : 0
            }).filter(id => id > 0)
            return ids.length > 0 ? Math.max(...ids) + 1 : 1
        } catch (error) {
            return 1
        }
    }
}

export const allService = new Service()
