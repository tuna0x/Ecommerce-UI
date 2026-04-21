import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Clock, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";
import { sendOtpApi, verifyOtpApi, checkEmailApi } from "../service/authService";
import { cn } from "../lib/utils";
import { GoogleLogin } from "@react-oauth/google";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // OTP States
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isEmailTaken, setIsEmailTaken] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const { register, socialLogin } = useAuth();
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

  // Handle Email Existence Check
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email) && !isOtpSent) {
      const timer = setTimeout(async () => {
        setIsCheckingEmail(true);
        try {
          const res = await checkEmailApi(email);
          setIsEmailTaken(res.data === true);
        } catch (error) {
          console.error("Lỗi kiểm tra email:", error);
        } finally {
          setIsCheckingEmail(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsEmailTaken(false);
    }
  }, [email, isOtpSent]);

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập định dạng email hợp lệ.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      await sendOtpApi(email);
      setIsOtpSent(true);
      setCountdown(300);
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
      const success = await register({ name, email, password, phoneNumber });

      if (success) {
        toast({
          title: "Đăng ký thành công!",
          description: "Chào mừng bạn đến với Bông Cosmetic.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Thao tác thất bại",
        description: error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const success = await socialLogin(credentialResponse.credential);
      if (success) {
        toast({
          title: "Đăng ký bằng Google thành công!",
          description: "Chào mừng bạn đến với Bông Cosmetic.",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Google login error", error);
      toast({
        title: "Lỗi đăng ký",
        description: error.response?.data?.message || "Không thể xác thực tài khoản Google.",
        variant: "destructive",
      });
    } finally {
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
                  <Label htmlFor="phoneNumber">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="0912345678"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setPhoneNumber(val);
                      }}
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
                      className={cn("pl-10", isEmailTaken && "border-destructive focus-visible:ring-destructive")}
                      required
                    />
                  </div>
                  {isEmailTaken && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-destructive font-bold flex items-center gap-1 mt-1"
                    >
                      ⚠️ Tài khoản với email này đã tồn tại!
                    </motion.p>
                  )}
                  {isCheckingEmail && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                       Đang kiểm tra...
                    </p>
                  )}
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
                    <Link to="/terms-of-service" className="text-primary hover:underline">Điều khoản dịch vụ</Link> và{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">Chính sách bảo mật</Link>
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
                      {countdown > 0 
                        ? `Gửi lại sau ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` 
                        : "Gửi lại ngay"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading || isSendingOtp || isEmailTaken || isCheckingEmail}>
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
          <div className="flex flex-col gap-3">
             <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast({
                    title: "Lỗi đăng ký",
                    description: "Đăng ký Google thất bại.",
                    variant: "destructive",
                  });
                }}
                useOneTap
                theme="outline"
                size="large"
                width="100%"
              />
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
