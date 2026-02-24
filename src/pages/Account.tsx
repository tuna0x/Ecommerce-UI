import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNavBar from "../components/MobileNavBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useToast } from "../hooks/use-toast";
import { User, Mail, Phone, MapPin, Camera, Save } from "lucide-react";

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "0901234567",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  React.useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Cập nhật thành công",
      description: "Thông tin tài khoản đã được cập nhật.",
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Đổi mật khẩu thành công",
      description: "Mật khẩu của bạn đã được thay đổi.",
    });
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold mb-6">Tài khoản của tôi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="mt-4 font-semibold text-lg">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Đăng xuất
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Quản lý tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
                  <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="pl-10"
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
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Địa chỉ</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: e.target.value,
                              })
                            }
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="mt-4">
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="password">
                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-4 max-w-md"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwords.currentPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            currentPassword: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            newPassword: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Xác nhận mật khẩu mới
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Button type="submit">Đổi mật khẩu</Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileNavBar />
    </div>
  );
};

export default Account;
