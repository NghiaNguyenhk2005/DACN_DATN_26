// Test e2e trong tiến trình gọi hàng trăm yêu cầu từ một IP: tắt giới hạn tần suất theo IP.
// Các test kiểm giới hạn tự bật lại bằng biến môi trường trước khi tạo app.
process.env.RATE_LIMIT_ENABLED = "false";
