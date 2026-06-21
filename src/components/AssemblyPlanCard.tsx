import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Scale,
  Gauge,
  Layers,
  Heart,
  Clock,
  RotateCcw,
  GitCompare,
  Trash2,
  Download,
  Sparkles,
  X,
} from 'lucide-react';
import type { AssemblyPlan, PlanVersion, PartType, Part } from '../types';
import { useGameStore } from '../store/useGameStore';
import { PART_TYPE_NAMES } from '../data/defaultConfig';
import { formatDate } from '../utils/helpers';
import { Modal } from './Modal';
import { StatBar } from './StatBar';

interface AssemblyPlanCardProps {
  plan: AssemblyPlan;
  onClick?: () => void;
  onDelete?: () => void;
  onLoad?: () => void;
  selectable?: boolean;
  selected?: boolean;
  showActions?: boolean;
  size?: 'sm' | 'md';
}

export function AssemblyPlanCard({
  plan,
  onClick,
  onDelete,
  onLoad,
  selectable = false,
  selected = false,
  showActions = true,
  size = 'md',
}: AssemblyPlanCardProps) {
  const config = useGameStore((s) => s.config);
  const selectedParts = useGameStore((s) => s.selectedParts);
  const calculateRobotStats = useGameStore((s) => s.calculateRobotStats);
  const rollbackToVersion = useGameStore((s) => s.rollbackToVersion);

  const [showVersions, setShowVersions] = useState(false);
  const [compareVersion, setCompareVersion] = useState<PlanVersion | null>(null);

  const installedCount = Object.values(plan.parts).filter(Boolean).length;

  const currentStats = useMemo(() => {
    return calculateRobotStats(selectedParts);
  }, [selectedParts, calculateRobotStats]);

  const getSetBonuses = (parts: Record<PartType, Part | null>) => {
    const setCounts: Record<string, number> = {};
    const types: PartType[] = ['head', 'body', 'arm', 'leg', 'core', 'tool'];
    types.forEach((type) => {
      const part = parts[type];
      if (part?.setBonus) {
        setCounts[part.setBonus] = (setCounts[part.setBonus] || 0) + 1;
      }
    });
    return Object.entries(setCounts)
      .filter(([setId, count]) => {
        const setConfig = config.setBonuses[setId];
        return setConfig && count >= setConfig.requiredParts;
      })
      .map(([setId]) => setId);
  };

  const activeSetBonuses = getSetBonuses(plan.parts);

  const handleRollback = (version: PlanVersion) => {
    rollbackToVersion(plan.id, version.id);
    setShowVersions(false);
  };

  const getDiffClass = (current: number, version: number) => {
    if (current > version) return 'text-neon-green';
    if (current < version) return 'text-neon-red';
    return 'text-white/50';
  };

  const getDiffArrow = (current: number, version: number) => {
    if (current > version) return '↑';
    if (current < version) return '↓';
    return '—';
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: onClick || selectable ? 1.02 : 1 }}
        whileTap={onClick || selectable ? { scale: 0.98 } : undefined}
        onClick={onClick}
        className={`card p-4 ${
          onClick || selectable ? 'cursor-pointer' : ''
        } transition-all relative ${
          selected ? 'ring-2 ring-neon-purple shadow-neon-purple' : 'hover:border-neon-purple/50'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white truncate">{plan.name}</h3>
            <p className="text-xs text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(plan.savedAt)}
            </p>
          </div>
          {showActions && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLoad?.();
                }}
                className="p-1.5 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors"
                title="加载方案"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVersions(!showVersions);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  showVersions
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                }`}
                title="历史版本"
              >
                <Clock className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1.5 rounded-lg bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors"
                  title="删除方案"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3">
          <div className="flex items-center gap-1">
            <Scale className="w-3 h-3 text-neon-blue" />
            <span className="text-white/70">{plan.totalWeight}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge
              className={`w-3 h-3 ${
                plan.totalEnergy > config.overloadRules.threshold
                  ? 'text-neon-red'
                  : 'text-neon-orange'
              }`}
            />
            <span
              className={
                plan.totalEnergy > config.overloadRules.threshold
                  ? 'text-neon-red'
                  : 'text-white/70'
              }
            >
              {plan.totalEnergy}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-neon-purple" />
            <span className="text-white/70">{plan.totalSkillSlots}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">{installedCount}/6 零件</span>
          {plan.versions.length > 1 && (
            <span className="text-neon-purple/70">{plan.versions.length} 个版本</span>
          )}
        </div>

        {activeSetBonuses.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {activeSetBonuses.map((setId) => {
              const setConfig = config.setBonuses[setId];
              if (!setConfig) return null;
              return (
                <span
                  key={setId}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple"
                >
                  <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                  {setConfig.name}
                </span>
              );
            })}
          </div>
        )}

        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-neon-purple flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showVersions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card border-t-0 rounded-t-none mt-0 p-3 space-y-2">
              <h4 className="text-sm font-bold text-white/70 flex items-center gap-2">
                <Clock className="w-4 h-4 text-neon-purple" />
                历史版本
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {[...plan.versions].reverse().map((version) => (
                  <div
                    key={version.id}
                    className="p-2 bg-background-tertiary/50 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-neon-purple">
                        v{version.versionNumber}
                      </span>
                      <span className="text-white/40">{formatDate(version.savedAt)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 font-mono mb-2">
                      <div className="text-center">
                        <p className="text-white/40 text-[10px]">重量</p>
                        <p className="text-neon-blue">{version.totalWeight}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-[10px]">能耗</p>
                        <p
                          className={
                            version.totalEnergy > config.overloadRules.threshold
                              ? 'text-neon-red'
                              : 'text-neon-orange'
                          }
                        >
                          {version.totalEnergy}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-[10px]">技能</p>
                        <p className="text-neon-purple">{version.totalSkillSlots}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-[10px]">耐久</p>
                        <p className="text-neon-green">{version.maxDurability}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareVersion(version);
                        }}
                        className="flex-1 btn btn-ghost text-[10px] py-1 px-2"
                      >
                        <GitCompare className="w-3 h-3 inline mr-1" />
                        对比
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRollback(version);
                        }}
                        className="flex-1 btn btn-secondary text-[10px] py-1 px-2"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" />
                        回滚
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!compareVersion}
        onClose={() => setCompareVersion(null)}
        title="版本对比"
        size="md"
      >
        {compareVersion && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-white/50 mb-1">当前装配</p>
                <p className="font-bold text-white">实时状态</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-white/50 mb-1">历史版本</p>
                <p className="font-bold text-neon-purple">
                  v{compareVersion.versionNumber}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-background-tertiary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-neon-blue" />
                  <span className="text-sm text-white/70">总重量</span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono font-bold ${
                      currentStats.totalWeight > compareVersion.totalWeight
                        ? 'text-neon-green'
                        : currentStats.totalWeight < compareVersion.totalWeight
                        ? 'text-neon-red'
                        : 'text-white'
                    }`}
                  >
                    {currentStats.totalWeight}
                    {currentStats.totalWeight !== compareVersion.totalWeight && (
                      <span className="text-xs ml-1">
                        ({currentStats.totalWeight > compareVersion.totalWeight ? '↑' : '↓'})
                      </span>
                    )}
                  </span>
                  <span className="text-white/30">vs</span>
                  <span className="font-mono text-white/70">
                    {compareVersion.totalWeight}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-background-tertiary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-neon-orange" />
                  <span className="text-sm text-white/70">总能耗</span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono font-bold ${
                      currentStats.totalEnergy > compareVersion.totalEnergy
                        ? 'text-neon-red'
                        : currentStats.totalEnergy < compareVersion.totalEnergy
                        ? 'text-neon-green'
                        : 'text-white'
                    }`}
                  >
                    {currentStats.totalEnergy}
                    {currentStats.totalEnergy !== compareVersion.totalEnergy && (
                      <span className="text-xs ml-1">
                        ({currentStats.totalEnergy > compareVersion.totalEnergy ? '↑' : '↓'})
                      </span>
                    )}
                  </span>
                  <span className="text-white/30">vs</span>
                  <span className="font-mono text-white/70">
                    {compareVersion.totalEnergy}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-background-tertiary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neon-purple" />
                  <span className="text-sm text-white/70">技能槽</span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono font-bold ${
                      currentStats.totalSkillSlots > compareVersion.totalSkillSlots
                        ? 'text-neon-green'
                        : currentStats.totalSkillSlots < compareVersion.totalSkillSlots
                        ? 'text-neon-red'
                        : 'text-white'
                    }`}
                  >
                    {currentStats.totalSkillSlots}
                    {currentStats.totalSkillSlots !== compareVersion.totalSkillSlots && (
                      <span className="text-xs ml-1">
                        ({currentStats.totalSkillSlots > compareVersion.totalSkillSlots ? '↑' : '↓'})
                      </span>
                    )}
                  </span>
                  <span className="text-white/30">vs</span>
                  <span className="font-mono text-white/70">
                    {compareVersion.totalSkillSlots}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-background-tertiary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-neon-green" />
                  <span className="text-sm text-white/70">最大耐久</span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-mono font-bold ${
                      currentStats.maxDurability > compareVersion.maxDurability
                        ? 'text-neon-green'
                        : currentStats.maxDurability < compareVersion.maxDurability
                        ? 'text-neon-red'
                        : 'text-white'
                    }`}
                  >
                    {currentStats.maxDurability}
                    {currentStats.maxDurability !== compareVersion.maxDurability && (
                      <span className="text-xs ml-1">
                        ({currentStats.maxDurability > compareVersion.maxDurability ? '↑' : '↓'})
                      </span>
                    )}
                  </span>
                  <span className="text-white/30">vs</span>
                  <span className="font-mono text-white/70">
                    {compareVersion.maxDurability}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              <h4 className="text-sm font-bold text-white mb-3">零件对比</h4>
              <div className="space-y-2">
                {(['head', 'body', 'arm', 'leg', 'core', 'tool'] as PartType[]).map(
                  (type) => {
                    const currentPart = selectedParts[type];
                    const versionPart = compareVersion.parts[type];
                    const isSame = currentPart?.id === versionPart?.id;

                    return (
                      <div
                        key={type}
                        className={`grid grid-cols-2 gap-4 p-2 rounded-lg text-xs ${
                          isSame ? 'bg-background-tertiary/30' : 'bg-neon-orange/10'
                        }`}
                      >
                        <div className="text-center">
                          <p className="text-white/40 mb-1">{PART_TYPE_NAMES[type]}</p>
                          <p
                            className={
                              currentPart ? 'text-white truncate' : 'text-white/30'
                            }
                          >
                            {currentPart?.name || '空'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-white/40 mb-1">历史版本</p>
                          <p
                            className={
                              versionPart ? 'text-neon-purple truncate' : 'text-white/30'
                            }
                          >
                            {versionPart?.name || '空'}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCompareVersion(null)}
                className="flex-1 btn btn-ghost"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  handleRollback(compareVersion);
                  setCompareVersion(null);
                }}
                className="flex-1 btn btn-primary"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                回滚到此版本
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
