# Smart Language Learning API

Backend Express + Mongoose cho frontend `D:\Smart-language-learning`.

## Chức năng

- Đăng nhập bằng code và trả JWT.
- CRUD article theo đúng user đang đăng nhập.
- CRUD vocabulary, tìm từ trùng và cập nhật lịch review.
- Mọi thao tác đọc/sửa/xóa đều được giới hạn theo chủ sở hữu.
- Import lại dữ liệu cũ từ ba file JSON.

## Cấu hình MongoDB Atlas Free

1. Tạo cluster M0 miễn phí trên MongoDB Atlas.
2. Trong **Database Access**, tạo database user.
3. Trong **Network Access**, thêm IP của máy/deployment chạy backend.
4. Sao chép `.env.example` thành `.env`, rồi điền `MONGODB_URI`.
5. Thay `JWT_SECRET` và `CODE_PEPPER` bằng hai chuỗi ngẫu nhiên khác nhau,
   mỗi chuỗi dài tối thiểu 32 ký tự. Không commit `.env`.

Ví dụ URI (phải URL-encode username/password nếu có ký tự đặc biệt):

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER_HOST/smart-language-learning?retryWrites=true&w=majority
```

## Chạy local

```bash
npm install
npm run seed:user
npm run dev
```

`seed:user` dùng `SEED_USER_NAME` và `SEED_USER_CODE` trong `.env`. Lệnh này
có thể chạy lại để thay code cho user cùng tên; code chỉ được lưu dưới dạng
HMAC, không lưu dạng plain text.

API mặc định chạy tại `http://localhost:5000`. Kiểm tra bằng
`GET http://localhost:5000/api/health`.

Ở frontend, `VITE_API_URL=/api` kết hợp với Vite proxy dùng được ngay khi chạy
local. Khi deploy frontend/backend khác domain, đặt `VITE_API_URL` thành URL
backend có hậu tố `/api`. Backend mặc định dùng `CLIENT_ORIGINS=*` để cho phép
request từ mọi origin.

## Import dữ liệu cũ

Đặt `users.json`, `articles.json`, `vocabulary.json` vào `data/import` rồi chạy:

```bash
npm run import:data
```

Chi tiết định dạng nằm trong `data/import/README.md`. Importer giữ lại quan hệ
user, ngày tạo, lịch review, số lần review và vị trí highlight; có thể chạy lại
an toàn nếu dữ liệu nguồn có trường `id`.

## API

- `POST /api/auth/code`
- `GET|POST /api/articles`
- `GET|PATCH|DELETE /api/articles/:id`
- `GET|POST /api/vocabulary`
- `GET /api/vocabulary/search?name=...`
- `PATCH|DELETE /api/vocabulary/:id`

Trừ endpoint login và health check, mọi request phải có header
`Authorization: Bearer <token>`.
