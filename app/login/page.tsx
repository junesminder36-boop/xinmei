"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  Lightbulb,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agreed, setAgreed] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("login-route");
    return () => document.body.classList.remove("login-route");
  }, []);

  useEffect(() => {
    // 已登录则自动跳转工作台
    const auth = localStorage.getItem("xinmei_auth");
    if (auth) {
      try {
        const { expiry } = JSON.parse(auth);
        if (Date.now() < expiry) {
          window.location.href = "/";
        } else {
          localStorage.removeItem("xinmei_auth");
        }
      } catch {
        localStorage.removeItem("xinmei_auth");
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("请先同意服务协议和隐私政策");
      return;
    }
    if (phone.trim() !== "15756009550" || password !== "youma666") {
      setError("账号或密码错误");
      return;
    }
    const expiry = remember
      ? Date.now() + 7 * 24 * 60 * 60 * 1000
      : Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("xinmei_auth", JSON.stringify({ phone: phone.trim(), expiry }));
    window.location.href = "/";
  };

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="新媒智检能力介绍">
        <div className="login-brand">
          <div className="login-brand-mark">智</div>
          <div>
            <div className="login-brand-name">新媒智检</div>
            <div className="login-brand-sub">CONTENT INTEGRITY PLATFORM</div>
          </div>
        </div>

        <div className="login-mascot-stage" aria-hidden="true">
          <div className="login-stage-glow" />
          <div className="login-stage-orbit login-stage-orbit-back" />
          <div className="login-stage-orbit login-stage-orbit-front" />
          <div className="login-float-card login-float-light">
            <span className="login-ai-mark">AI</span>
          </div>
          <div className="login-float-card login-float-chart">
            <span className="login-chart-mark">
              <i />
              <i />
              <i />
              <i />
              <b />
            </span>
          </div>
          <div className="login-float-card login-float-shield">
            <ShieldCheck size={36} />
          </div>
          <div className="login-float-card login-float-text">
            <span className="login-text-mark">
              <i />
              <i />
              <i />
            </span>
          </div>
          <img src="/assistant-avatar.png" alt="" className="login-mascot" />
        </div>

        <div className="login-copy">
          <h2>发布前，完成差异化合规把关。</h2>
          <p>
            从选题灵感、同质化诊断到平台预检与政策核验，帮助新媒体团队更稳地发布内容。
          </p>
        </div>

        <div className="login-feature-grid">
          <div className="login-feature-card">
            <span><Lightbulb size={18} /></span>
            <strong>选题灵感</strong>
            <p>新闻描述一键生成多平台选题角度</p>
          </div>
          <div className="login-feature-card">
            <span><FileText size={18} /></span>
            <strong>差异化诊断</strong>
            <p>识别同质化风险与常见表达套路</p>
          </div>
          <div className="login-feature-card">
            <span><ShieldCheck size={18} /></span>
            <strong>合规预检</strong>
            <p>政策核验、敏感表述与平台规则提示</p>
          </div>
        </div>

        <div className="login-visual-footer">
          <span>© 2026 新媒智检</span>
          <a href="#">服务协议</a>
          <a href="#">隐私政策</a>
          <a href="#">帮助中心</a>
        </div>
      </section>

      <section className="login-panel" aria-label="登录">
        <div className="login-panel-card">
          <div className="login-brand-top">
            <img src="/youma-symbol.png" alt="" className="login-brand-logo-img" />
            <div className="login-brand-copy">
              <div className="login-product-name">新媒智检网站</div>
              <div className="login-product-sub">优码科技 · YOUMATECH</div>
            </div>
          </div>

          <div className="login-welcome">
            <h1>欢迎回来</h1>
            <p>登录您的优码科技账号，开启智能体验</p>
          </div>

          <form className="login-form-v2" onSubmit={handleSubmit}>
            <label className="login-field-v2">
              <span>账号</span>
              <div className="login-input-v2">
                <UserRound size={18} strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="请输入账号"
                  autoComplete="username"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </label>

            <label className="login-field-v2">
              <span>密码</span>
              <div className="login-input-v2">
                <LockKeyhole size={18} strokeWidth={1.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-eye-v2"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <div className="login-error-v2">{error}</div>}

            <div className="login-options-v2">
              <label className="login-check-v2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>记住我</span>
              </label>
              <a href="#">忘记密码？</a>
            </div>

            <button type="submit" className="login-submit-v2">
              登录
            </button>

            <label className="login-check-v2 login-agreement-v2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>
                我已阅读并同意 <a href="#">《服务协议》</a> 和 <a href="#">《隐私政策》</a>
              </span>
            </label>
          </form>

          <div className="login-panel-footer">
            <span>© 2026 优码科技 版权所有</span>
            <div className="login-panel-footer-links">
              <a href="#">隐私政策</a>
              <a href="#">服务协议</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
