import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowLeft, KeyRound, CheckCircle2, ShieldCheck, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { forgotPasswordApi, resetPasswordApi } from "../service/authService";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await forgotPasswordApi(email);
      toast({
        title: "Đã gửi mã OTP",
        description: "Vui lòng kiểm tra email để lấy mã xác thực.",
      });
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gửi OTP. Vui lòng kiểm tra lại email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextToPasswords = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
        toast({
            title: "Mã OTP không hợp lệ",
            description: "Vui lòng nhập đủ 6 chữ số.",
            variant: "destructive"
        });
        return;
    }
    setStep(3);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Mật khẩu không khớp",
        description: "Vui lòng kiểm tra lại mật khẩu xác nhận.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordApi({
        email,
        otp,
        newPassword
      });
      
      toast({
        title: "Thành công",
        description: "Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn.",
        variant: "destructive",
      });
      // If OTP fails, maybe go back to step 2
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const stepProgress = step === 1 ? "33%" : step === 2 ? "66%" : "100%";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>

        <div className="bg-background rounded-2xl shadow-xl border border-border p-8 relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-muted">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: "33%" }}
              animate={{ width: stepProgress }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Quên mật khẩu?</h1>
                  <p className="text-muted-foreground">
                    Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email tài khoản</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                    {isLoading ? "Đang gửi mã..." : "Gửi mã xác thực"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Xác thực mã</h1>
                  <p className="text-muted-foreground">
                    Mã 6 chữ số đã được gửi tới <span className="text-foreground font-medium">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleNextToPasswords} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Mã xác thực (OTP)</Label>
                    <div className="relative">
                      <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="pl-10 h-12 text-center tracking-[0.5em] font-mono text-xl"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg">
                    Tiếp tục
                  </Button>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Sai email? Nhập lại
                    </button>
                    <button 
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isLoading}
                      className="text-sm text-primary hover:underline"
                    >
                      {isLoading ? "Đang gửi lại..." : "Gửi lại mã xác thực"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Mật khẩu mới</h1>
                  <p className="text-muted-foreground">
                    Vui lòng tạo một mật khẩu mạnh để bảo vệ tài khoản của bạn.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 h-12"
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
                      <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                    {isLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
