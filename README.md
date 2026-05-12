# 🛍️ E-Commerce Premium React SPA (Frontend Client)

Ứng dụng Single Page Application (SPA) cao cấp, hiện đại và mượt mà, đóng vai trò là giao diện khách hàng và trang quản trị trực quan cho hệ sinh thái e-commerce. Dự án được thiết kế tỉ mỉ với các vi tương tác (micro-interactions) chân thực, hiệu ứng chuyển động chất lượng cao, khả năng chuyển đổi giao diện sáng/tối (Dark Mode) và đồng bộ trạng thái thời gian thực.

---

## 🛠️ Công Nghệ Sử Dụng & Kiến Trúc Giao Diện

- **Lõi Công Nghệ**: React 19, TypeScript (strict mode), Vite (môi trường đóng gói và chạy dev siêu tốc).
- **Giao Diện & Chuyển Động (UI/UX)**:
  - **TailwindCSS**: Hệ thống grid layout tiện ích và tương thích hoàn hảo trên mọi thiết bị (Responsive).
  - **Radix UI**: Các thành phần giao diện không style nhưng tối ưu về mặt truy cập (Accessible primitives) như Accordion, Dialog, Select, Dropdown, Checkbox.
  - **Framer Motion**: Thư viện xử lý hiệu ứng chuyển trang mượt mà, hiệu ứng trượt/nổi và phản hồi vi tương tác khi di chuột (hover).
  - **Lucide React**: Bộ icon hiện đại, tối giản.
- **Quản Lý Trạng Thái & Đồng Bộ Dữ Liệu**:
  - **TanStack React Query v5**: Quản lý bộ nhớ đệm (caching) dữ liệu từ máy chủ, tự động cập nhật ngầm, tối ưu hóa phân trang và giảm số lượng request thừa lên server.
  - **Axios**: Cấu hình Interceptors tự động đính kèm token JWT, xử lý cơ chế làm mới token tự động (silent refresh) và định dạng thông điệp lỗi chuẩn hóa từ API backend.
- **Tương Tác Thời Gian Thực**: Thư viện `@stomp/stompjs` & `sockjs-client` duy trì kết nối WebSocket (hỗ trợ luồng Chat trực tuyến với Admin, nhận thông báo đẩy tức thì và cập nhật số lượng mua Flash Sale).
- **Khung Kiểm Thử (Testing)**: **Vitest** (trình chạy test cực nhanh tích hợp trực tiếp với Vite) phối hợp cùng **React Testing Library** và **@testing-library/user-event** (kiểm thử dựa trên hành vi người dùng).
- **Tiện ích mở rộng**: `recharts` (vẽ biểu đồ báo cáo và thống kê doanh thu trực quan ở trang Admin), `react-helmet-async` (quản lý metadata động và tối ưu hóa SEO).

---

## ✨ Các Tính Năng Giao Diện Nổi Bật

1. **Giao Diện Cao Cấp & Đậm Chất Thẩm Mỹ**: Áp dụng bảng màu được thiết kế hài hòa, đồng bộ hóa chế độ Light/Dark theo hệ điều hành hoặc lựa chọn của người dùng, sử dụng hiệu ứng Glassmorphism hiện đại và micro-animations nâng tầm trải nghiệm.
2. **Đồng Bộ Bộ Nhớ Đệm Server-State**: Danh mục sản phẩm, thông tin thương hiệu, giỏ hàng và ví voucher của người dùng được lưu đệm thông minh qua React Query. Mọi hành động cập nhật (như thêm giỏ hàng, áp mã giảm giá) đều kích hoạt thu hồi cache tức thì (cache invalidation) để hiển thị giao diện mới ngay lập tức.
3. **Kênh Chat và Thông Báo Đẩy Live**: Trò chuyện thời gian thực và nhận thông báo cập nhật trạng thái đơn hàng tức thì nhờ kết nối WebSocket luôn mở với máy chủ Backend.
4. **Kiểm Tra Form Resilient & Type-safe**: Mọi trường nhập liệu đầu vào đều được gán ràng buộc nghiêm ngặt để ngăn chặn dữ liệu sai cấu trúc trước khi gửi yêu cầu thanh toán lên server.
5. **Tối Ưu SEO Nâng Cao**: Sử dụng `react-helmet-async` để tiêm động các thẻ `title` mô tả sản phẩm, thẻ `meta description` tương ứng và phân cấp thẻ heading chuẩn SEO theo từng route trang.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
Ecommerce-UI/
├── src/
│   ├── assets/             # Hình ảnh, icon và các tệp tài nguyên tĩnh dùng chung
│   ├── components/         # Các thành phần UI có thể tái sử dụng (Buttons, Inputs, Modals, SEO, v.v.)
│   ├── context/            # Quản lý trạng thái toàn cục (Theming, Authentication)
│   ├── hooks/              # Bộ Custom React Hooks tự phát triển (useAuth, useCart, useWindowSize)
│   ├── layouts/            # Khuôn mẫu giao diện (Admin Dashboard, Customer Shop, Landing Page)
│   ├── pages/              # Các trang chính của hệ thống (Shop, Checkout, Dashboard quản lý)
│   ├── services/           # Trình gọi API Axios và React Query hooks (OrderService, ProductService)
│   ├── setupTests.ts       # Cấu hình môi trường chạy test (mocks, custom matchers cho jest-dom)
│   └── main.tsx            # Điểm khởi đầu khởi chạy ứng dụng
├── public/                 # Các tệp tĩnh được copy trực tiếp vào thư mục phân phối khi build
├── vitest.config.ts        # File cấu hình chuyên biệt cho môi trường kiểm thử Vitest
├── vite.config.ts          # File cấu hình hoạt động của Vite và alias đường dẫn
├── tsconfig.json           # File cấu hình TypeScript chính của dự án
└── tailwind.config.js      # Định nghĩa các tokens giao diện, màu sắc, font chữ và hiệu ứng chuyển động
```

---

## 🚀 Hướng Dẫn Khởi Chạy

### Yêu Cầu Hệ Thống
- **Node.js** (Khuyến nghị phiên bản 18 hoặc cao hơn)
- **npm** hoặc **yarn**

### 1. Cài Đặt Thư Viện Phụ Thuộc
Chạy lệnh sau tại thư mục gốc `Ecommerce-UI` để cài đặt đầy đủ các thư viện và devDependencies:
```bash
npm install
```

### 2. Khởi Chạy Môi Trường Phát Triển (Development Mode)
Khởi chạy local dev server với tính năng Hot Module Replacement (HMR - tự động phản hồi thay đổi mã nguồn lên trình duyệt mà không cần F5):
```bash
npm run dev
```
Truy cập [http://localhost:5173](http://localhost:5173) trên trình duyệt để trải nghiệm sản phẩm.

### 3. Đóng Gói Production Build
Biên dịch mã nguồn TypeScript và tối ưu hóa nén nhẹ tài nguyên tĩnh (tree-shaken, minified) để chuẩn bị deploy lên các máy chủ hosting (Vercel, Netlify, v.v.):
```bash
npm run build
```
Bộ mã nguồn tĩnh hoàn chỉnh sau khi tối ưu sẽ được lưu tại thư mục `/dist`.

---

## 🧪 Chạy Bộ Kiểm Thử (Frontend Tests)

Hệ thống tích hợp sẵn các bài kiểm tra giao diện tự động bằng công nghệ Vitest và JSDOM.

### Chạy Ở Chế Độ Watch (Tiện lợi khi code)
Để chạy các bài test ở chế độ theo dõi tương tác thời gian thực:
```bash
npx vitest
```

### Chạy Test Một Lần (Cho quy trình CI/CD / Đánh giá độ ổn định)
Để thực thi nhanh bộ test và kiểm tra tổng quát:
```bash
npx vitest run
```
Trình chạy test sẽ biên dịch toàn bộ, giả lập môi trường trình duyệt bằng JSDOM, thực thi hành vi click/nhập dữ liệu và kiểm chứng tính đúng đắn của giao diện.
