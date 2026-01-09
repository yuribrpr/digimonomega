import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Settings, Save, RefreshCw, Zap, Coins, AlertCircle } from 'lucide-react';
import api from '../services/api';
export default function AdminGameSettings() {
  const [settings, setSettings] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState({});
  const [changed, setChanged] = useState({});
  // Filter only Global Multipliers
  const filteredSettings = settings.filter(s => 
    ['global_xp_multiplier', 'global_bits_multiplier'].includes(s.setting_key)
  );
  useEffect(() => {
    fetchSettings();
  }, []);
  useEffect(() => {
    const initialValues = {};
    settings.forEach(s => {
        initialValues[s.setting_key] = s.setting_value;
    });
    setFormValues(initialValues);
  }, [settings]);
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/settings');
      setSettings(res.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    // Check if value actually changed from original
    const original = settings.find(s => s.setting_key === key);
    if (original && original.setting_value !== value) {
        setChanged(prev => ({ ...prev, [key]: true }));
    } else {
        setChanged(prev => ({ ...prev, [key]: false }));
    }
  };
  const handleUpdate = async (key) => {
    const value = formValues[key];
    setUpdating(prev => ({ ...prev, [key]: true }));
    try {
      await api.put(`/api/settings/${key}`, { value });
      // Update local settings state to reflect save
      setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s));
      setChanged(prev => ({ ...prev, [key]: false }));
      // Visual feedback could go here (toast)
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Erro ao atualizar configuração.');
    } finally {
      setUpdating(prev => ({ ...prev, [key]: false }));
    }
  };
  const getIcon = (key) => {
      if (key.includes('xp')) return <Zap className="w-5 h-5 text-yellow-500" />;
      if (key.includes('bits')) return <Coins className="w-5 h-5 text-yellow-500" />;
      return <Settings className="w-5 h-5 text-slate-400" />;
  };
  return (
    <div className="container max-w-4xl mx-auto py-10 px-6 min-h-screen">
      <div className="flex flex-col space-y-2 mb-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100">Configurações do Jogo</h1>
                <p className="text-muted-foreground text-slate-400">Gerencie as taxas globais e multiplicadores do servidor.</p>
            </div>
            <Button onClick={fetchSettings} variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
                Atualizar
            </Button>
        </div>
      </div>
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
        <CardHeader className="border-b border-slate-800 pb-6">
            <CardTitle className="text-xl text-slate-100">Taxas Globais</CardTitle>
            <CardDescription className="text-slate-400">
                Ajuste os multiplicadores para balancear a economia e progressão do jogo.
            </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
            {filteredSettings.length === 0 && !loading && (
                <div className="flex items-center justify-center py-8 text-slate-500">
                    <AlertCircle className="mr-2 h-5 w-5" /> Nenhuma configuração global encontrada.
                </div>
            )}
            {filteredSettings.map((setting) => (
                <div 
                    key={setting.setting_key} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-950/30 hover:bg-slate-900/50 transition-all duration-200"
                >
                    <div className="flex items-start gap-4 mb-4 sm:mb-0 flex-1">
                        <div className="p-2 rounded-full bg-slate-900 border border-slate-800 mt-1">
                            {getIcon(setting.setting_key)}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={setting.setting_key} className="text-base font-medium text-slate-200 cursor-pointer">
                                {setting.description || setting.setting_key}
                            </Label>
                            <p className="text-sm text-slate-500 font-mono break-all">
                                {setting.setting_key}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto pl-14 sm:pl-0">
                         <div className="relative w-full sm:w-32">
                            <Input 
                                id={setting.setting_key}
                                type="number" 
                                value={formValues[setting.setting_key] || ''}
                                onChange={(e) => handleInputChange(setting.setting_key, e.target.value)}
                                className="pr-8 text-right font-mono bg-slate-900 border-slate-700 focus:ring-yellow-500/50"
                                step="0.1"
                                min="0"
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-slate-500">x</span>
                        </div>
                        <Button 
                            size="icon"
                            onClick={() => handleUpdate(setting.setting_key)}
                            disabled={updating[setting.setting_key] || !changed[setting.setting_key]}
                            className={`transition-all ${changed[setting.setting_key] ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                            title={changed[setting.setting_key] ? "Salvar alterações" : "Sem alterações"}
                        >
                             {updating[setting.setting_key] ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
