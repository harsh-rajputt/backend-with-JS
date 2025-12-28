class ApiResponse {
    constructor(success, message, data = "Success") {
        this.statusCode = this.statusCode
        this.data = data
        this.message = message
        this.success = this.statusCode < 400
    }
}