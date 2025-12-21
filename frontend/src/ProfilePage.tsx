import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser, logout } = useAuth();
  
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const usageData = [
    { action: 'superip_video_gen', time: '2025-12-19 22:42', change: '-4590', status: 'Completed' },
    { action: 'superip_image_gen', time: '2025-12-19 22:41', change: '+0', status: 'Completed' },
    { action: 'superip_video_gen', time: '2025-12-19 19:40', change: '-4590', status: 'Completed' },
    { action: 'superip_image_gen', time: '2025-12-19 19:39', change: '+0', status: 'Completed' },
    { action: 'superip_image_gen', time: '2025-12-19 19:32', change: '+0', status: 'Completed' },
    { action: 'superip_image_gen', time: '2025-12-19 19:29', change: '+0', status: 'Completed' },
    { action: 'superip_video_gen', time: '2025-12-19 17:58', change: '-4590', status: 'Completed' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openModal = (points: string) => {
    setSelectedPoints(points);
    setPurchaseModalOpen(true);
  };

  const closeModal = () => {
    setPurchaseModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-blue-50">
        <div className="text-xl font-semibold text-blue-600">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pointsOptions = ["10000", "20000", "50000", "100000"];
  const levelProgress = (user.points % 500) / 500 * 100;

  const identityMap: Record<string, string> = {
    'free': '免费用户',
    'creator': '创作者',
    'business': '企业用户'
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#eff6ff]">
      {/* 侧边栏 */}
      <aside className="sidebar flex flex-col items-center py-4">
        <div className="sidebar-item" onClick={() => navigate('/home')}>
          <div className="icon-wrapper">
            <div className="hover-bg"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col justify-center gap-4">
          <div className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <div className="shape-bg">
              <svg className="svg-shape" viewBox="0 0 54 72" preserveAspectRatio="none">
                <path d="M 54,0 Q 13.5,0 13.5,18 L 13.5,54 Q 13.5,72 54,72 L 54,0 Z" />
              </svg>
            </div>
            <div className="bottom-curve"></div>
            <div className="icon-wrapper">
              <div className="hover-bg"></div>
              {activeTab === 'profile' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 12a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              )}
            </div>
          </div>

          <div className={`sidebar-item ${activeTab === 'usage' ? 'active' : ''}`} onClick={() => setActiveTab('usage')}>
            <div className="shape-bg">
              <svg className="svg-shape" viewBox="0 0 54 72" preserveAspectRatio="none">
                <path d="M 54,0 Q 13.5,0 13.5,18 L 13.5,54 Q 13.5,72 54,72 L 54,0 Z" />
              </svg>
            </div>
            <div className="bottom-curve"></div>
            <div className="icon-wrapper">
              <div className="hover-bg"></div>
              {activeTab === 'usage' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3v18h18v-2H5V3H3zm5 14h2v-3H8v3zm5 0h2V5h-2v12zm5 0h2V9h-2v8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 主体内容 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'profile' && (
          <header className="pt-16 pb-12 px-8 border-b border-blue-100 bg-white">
            <div className="max-w-7xl mx-auto w-full flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-500 flex items-center justify-center text-blue-600 shadow-sm">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-slate-800">{user.username}</h1>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-bold">
                          {user.identity || 'free'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{user.email}</p>
                    
                    <div className="mt-5">
                      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">剩余积分</div>
                      <div className="text-4xl font-black text-blue-600 leading-none">{user.points || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        <section className={`flex-1 overflow-y-auto p-8 ${activeTab === 'usage' ? 'flex items-center' : ''}`}>
          <div className="max-w-7xl mx-auto w-full">
            {activeTab === 'profile' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {pointsOptions.map((points, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 card-shadow border border-blue-50 flex flex-col items-center justify-between hover:border-blue-200 transition-all cursor-pointer group hover:-translate-y-1">
                    <div className="aspect-square bg-blue-50/50 rounded-xl mb-4 flex flex-col items-center justify-center group-hover:bg-blue-100 transition-colors w-full relative overflow-hidden">
                      <span className="points-text text-4xl font-black tracking-tighter">{points}</span>
                      <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-1">POINTS</span>
                      
                      <svg className="absolute -right-2 -bottom-2 w-12 h-12 text-blue-500/10 rotate-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                      </svg>
                    </div>
                    <button 
                      onClick={() => openModal(points)} 
                      className="w-full py-2 bg-black rounded-lg text-white font-semibold text-sm hover:bg-zinc-800 transition-colors"
                    >
                      购买积分
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
                <div className="p-6 border-b border-blue-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Usage Details</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Credits Change</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {usageData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-700 font-mono">{item.action}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{item.time}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-black ${item.change.startsWith('-') ? 'text-slate-900' : 'text-emerald-500'}`}>
                              {item.change}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 border-t border-blue-50 flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-medium">Showing 1 - 7 of 20 records</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Previous</button>
                    <div className="flex gap-1">
                      <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold">1</button>
                      <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-bold transition-colors">2</button>
                      <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-bold transition-colors">3</button>
                    </div>
                    <button className="px-4 py-2 text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">Next</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 弹窗部分 */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">购买积分</h2>
            <p className="text-slate-500 mb-6">您正在购买 <span className="font-bold text-black">{selectedPoints}</span> 会员积分，请选择支付方式以继续。</p>
            <div className="flex gap-4">
              <button onClick={closeModal} className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors">立即支付</button>
              <button onClick={closeModal} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
