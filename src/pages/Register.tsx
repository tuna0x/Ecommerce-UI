import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";
import { sendOtpApi, verifyOtpApi } from "../service/authService";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // OTP States
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email hợp lệ trước khi gửi mã.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      await sendOtpApi(email);
      setIsOtpSent(true);
      setCountdown(60);
      toast({
        title: "Đã gửi mã OTP",
        description: "Vui lòng kiểm tra email của bạn.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi gửi mã",
        description: error.response?.data?.message || "Không thể gửi mã OTP, vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // STEP 1: Send OTP
    if (!isOtpSent) {
      if (password !== confirmPassword) {
        toast({
          title: "Lỗi",
          description: "Mật khẩu xác nhận không khớp.",
          variant: "destructive",
        });
        return;
      }

      if (password.length < 6) {
        toast({
          title: "Lỗi",
          description: "Mật khẩu phải có ít nhất 6 ký tự.",
          variant: "destructive",
        });
        return;
      }

      await handleSendOtp();
      return;
    }

    // STEP 2: Verify & Register
    if (!otp) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã OTP.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify OTP
      await verifyOtpApi(email, otp);
      
      // 2. Register
      const success = await register({ name, email, password });

      if (success) {
        toast({
          title: "Đăng ký thành công!",
          description: "Chào mừng bạn đến với Bông Cosmetic.",
        });
        navigate("/");
      } else {
        toast({
          title: "Đăng ký thất bại",
          description: "Email này đã được sử dụng hoặc có lỗi xảy ra.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        title: "Xác thực thất bại",
        description: error.response?.data?.message || "Mã OTP không chính xác.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </Link>

        {/* Register Card */}
        <div className="bg-background rounded-2xl shadow-xl border border-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              BÔNG<span className="text-primary">COSMETIC</span>
            </h1>
            <p className="text-muted-foreground">Tạo tài khoản mới</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isOtpSent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="rounded border-border mt-1"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    Tôi đồng ý với{" "}
                    <a href="#" className="text-primary hover:underline">Điều khoản dịch vụ</a> và{" "}
                    <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>
                  </label>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <p className="text-sm text-center text-muted-foreground">
                    Mã xác thực đã được gửi đến: <br />
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="block mx-auto mt-2 text-xs text-primary hover:underline"
                  >
                    Thay đổi Email?
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Mã xác thực OTP</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Nhập 6 số"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="pl-10 text-center tracking-[0.5em] font-bold text-lg"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-muted-foreground">Không nhận được mã?</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={countdown > 0}
                      className="text-xs text-primary font-medium disabled:text-muted-foreground hover:underline"
                    >
                      {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại ngay"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading || isSendingOtp}>
              {isLoading || isSendingOtp ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </div>
              ) : (
                isOtpSent ? "Xác nhận & Hoàn tất" : "Tiếp tục đăng ký"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Hoặc
              </span>
            </div>
          </div>

          {/* Social Register */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="w-full">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button variant="outline" type="button" className="w-full">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
