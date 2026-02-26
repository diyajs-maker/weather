"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Message {
    id: string;
    channel: string;
    status: string;
    content: string;
    uploadReceived: boolean;
    createdAt: string;
}

interface BuildingDashboard {
    buildingName: string;
    city: string;
    complianceRate: number;
    recentMessages: Message[];
    isPaused: boolean;
}

export default function BuildingDashboardPage() {
    const params = useParams();
    if (!params) return null;
    const buildingId = params.id as string;
    const [data, setData] = useState<BuildingDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Auto-login as building manager for testing purposes
        const login = async () => {
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: "building@test.com", password: "123456" }),
                });
                const loginData = await res.json();
                if (loginData.token) {
                    setToken(loginData.token);
                } else {
                    setError("Failed to authenticate for testing");
                }
            } catch (err) {
                setError("Error during auto-login");
            }
        };
        login();
    }, []);

    const fetchDashboard = async () => {
        if (!token) return;
        try {
            const res = await fetch(`/api/dashboard/building/${buildingId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const dashData = await res.json();
            if (res.ok) {
                setData(dashData);
            } else {
                setError(dashData.message || "Failed to fetch dashboard");
            }
        } catch (err) {
            setError("Network error fetching dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [token, buildingId]);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">{data?.buildingName}</h1>
                        <p className="text-slate-500 font-medium">{data?.city} &bull; Building Dashboard</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchDashboard}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Refresh Data
                        </button>
                        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${data?.isPaused ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {data?.isPaused ? 'Paused' : 'Active'}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Compliance Rate</p>
                        <p className="text-4xl font-black text-blue-600">{data?.complianceRate}%</p>
                    </div>
                </div>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900">Recent Alerts & Messages</h2>
                    <div className="space-y-4">
                        {data?.recentMessages.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2rem] text-center border border-dashed border-slate-200">
                                <p className="text-slate-400">No alerts triggered yet.</p>
                            </div>
                        ) : (
                            data?.recentMessages.map((msg) => (
                                <div key={msg.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${msg.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {msg.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {msg.channel} &bull; {new Date(msg.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed font-medium">
                                        {msg.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <footer className="pt-12 border-t border-slate-200">
                    <p className="text-slate-400 text-sm text-center">
                        To test: Run the cron check-alerts API and refresh this page.
                    </p>
                </footer>
            </div>
        </div>
    );
}
