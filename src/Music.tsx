import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, ChevronDown, ChevronUp, Image as ImageIcon, List, Grid, X, Music as MusicIcon, Star, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export interface MusicTrack {
  id?: number;
  music_id?: number;
  track_number: number;
  title: string;
  is_title_track: boolean;
  composer: string;
  lyricist: string;
  arranger: string;
  genre: string;
  mood: string;
  instrument: string;
  bpm: string;
  chart_peak: string;
  pop_rating: number;
  love_rating: number;
  art_rating: number;
  analysis: string;
}

export interface MusicItem {
  [x: string]: any;
  id: number;
  title: string;
  artist: string;
  type: string;
  purpose: string;
  pop_rating: number;
  love_rating: number;
  art_rating: number;
  genre: string;
  mood: string;
  instrument: string;
  release_year: string;
  bpm: string;
  chart_peak: string;
  concept: string;
  composer: string;
  arranger: string;
  lyricist: string;
  distributor: string;
  analysis: string;
  cover_image: string;
}


type SortField = 'id' | 'title' | 'artist' | 'type' | 'release_year' | 'pop_rating' | 'love_rating' | 'art_rating';

const MultiSelectInput = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  existingOptions 
}: { 
  label: string, 
  placeholder: string, 
  value: string, 
  onChange: (v: string) => void, 
  existingOptions: string[] 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItems = value ? value.split(',').filter(Boolean).map(s => s.trim()) : [];
  
  const filteredOptions = existingOptions
    .filter(opt => !selectedItems.includes(opt) && opt.toLowerCase().includes(inputValue.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const handleAdd = (item: string) => {
    item = item.trim();
    if (!item) return;
    if (selectedItems.includes(item)) {
      alert('이미 추가된 항목입니다.');
      return;
    }
    onChange([...selectedItems, item].join(', '));
    setInputValue('');
  };

  const handleRemove = (item: string) => {
    onChange(selectedItems.filter(i => i !== item).join(', '));
  };

  return (
    <div className="flex-1 flex flex-col relative min-w-0" onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}>
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>}
      <div 
        className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all flex flex-wrap gap-1 bg-white cursor-text min-h-[34px] items-center"
        onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
      >
        {selectedItems.map(item => (
          <span key={item} className="px-2 py-0.5 bg-slate-100 rounded-[1px] text-[10px] text-slate-600 flex items-center gap-1 max-w-full truncate">
            <span className="truncate">{item}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(item); }} className="text-slate-400 hover:text-rose-500 shrink-0"><X className="w-3 h-3"/></button>
          </span>
        ))}
        <input 
          ref={inputRef}
          type="text" 
          value={inputValue} 
          onChange={e => { setInputValue(e.target.value); setIsOpen(true); }}
          onKeyDown={e => { 
            if (e.key === 'Enter') { 
              e.preventDefault(); 
              e.stopPropagation();
              handleAdd(inputValue); 
            } else if (e.key === 'Backspace' && !inputValue && selectedItems.length > 0) {
              handleRemove(selectedItems[selectedItems.length - 1]);
            }
          }} 
          onFocus={() => setIsOpen(true)}
          className="flex-1 min-w-[60px] outline-none text-xs bg-transparent h-6" 
          placeholder={selectedItems.length === 0 ? placeholder : ""} 
        />
      </div>
      
      {isOpen && (inputValue || filteredOptions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto z-[120]">
          {inputValue && !existingOptions.includes(inputValue.trim()) && !selectedItems.includes(inputValue.trim()) && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-sky-600 hover:bg-slate-50 font-medium"
              onMouseDown={(e) => { e.preventDefault(); handleAdd(inputValue); }}
            >
              "{inputValue}" 추가하기
            </button>
          )}
          {filteredOptions.map(opt => (
            <button
              key={opt}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onMouseDown={(e) => { e.preventDefault(); handleAdd(opt); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


export default function Music() {
  const [music, setMusic] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get('type');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'tracks'>('info');

  const initialItem: MusicItem = {
    id: 0, title: '', artist: '', type: '앨범', purpose: 'Love',
    pop_rating: 0, love_rating: 0, art_rating: 0,
    genre: '', mood: '', instrument: '', release_year: '', bpm: '', chart_peak: '',
    concept: '', composer: '', arranger: '', lyricist: '', distributor: '', analysis: '', cover_image: ''
  };

  const [newItem, setNewItem] = useState<MusicItem>(initialItem);
  const [newTracks, setNewTracks] = useState<MusicTrack[]>([]);

  const [selectedMusic, setSelectedMusic] = useState<MusicItem | null>(null);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);

  const [options, setOptions] = useState<any>({ artists: [], composers: [], lyricists: [], arrangers: [], genres: [], bpms: [] });
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');


  
  useEffect(() => {
    fetchMusic();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/music/options');
      const data = await response.json();
      setOptions(data);
    } catch (err) {
      console.error(err);
    }
  };


  const fetchMusic = async () => {
    try {
      const res = await fetch('/api/music');
      const data = await res.json();
      setMusic(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = async (item: MusicItem) => {
    setSelectedMusic(item);
    try {
      const res = await fetch(`/api/music/${item.id}/tracks`);
      if (res.ok) {
        const data = await res.json();
        setMusicTracks(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMusic = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/music/${id}`, { method: 'DELETE' });
      setMusic(music.filter(c => c.id !== id));
      if (selectedMusic?.id === id) setSelectedMusic(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = async (item: MusicItem) => {
    setNewItem(item);
    try {
      const res = await fetch(`/api/music/${item.id}/tracks`);
      if (res.ok) {
        const data = await res.json();
        setNewTracks(data);
      }
    } catch (e) {
      console.error(e);
    }
    setActiveTab('info');
    setSelectedMusic(null);
    setShowAddModal(true);
  };

  const handleAddMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;
    try {
      const payload = { ...newItem, tracks: newTracks };
      let newId = newItem.id;
      if (newId) {
        await fetch(`/api/music/${newId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setShowAddModal(false);
      setNewItem(initialItem);
      setNewTracks([]);
      fetchMusic();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMusic = music.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.artist && item.artist.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !typeFilter || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedMusic = [...filteredMusic].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const SortIcon = ({ field, absolute }: { field: SortField, absolute?: boolean }) => {
    if (sortField !== field) return absolute ? null : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0" />;
    const Icon = sortDirection === 'asc' ? ChevronUp : ChevronDown;
    const baseClass = "w-3 h-3 text-sky-500 " + (absolute ? "absolute right-1 top-1/2 -translate-y-1/2" : "inline-block ml-1");
    return <Icon className={baseClass} />;
  };


  
  // ----------------------------------------------------
  // Track Editor Handlers
  // ----------------------------------------------------
  const addEmptyTrack = () => {
    setNewTracks([...newTracks, {
      track_number: newTracks.length + 1,
      title: '', is_title_track: false, composer: '', lyricist: '', arranger: '',
      genre: '', mood: '', instrument: '', bpm: '', chart_peak: '',
      pop_rating: 0, love_rating: 0, art_rating: 0, analysis: ''
    }]);
  };

  const updateTrack = (index: number, field: keyof MusicTrack, value: any) => {
    const updated = [...newTracks];
    updated[index] = { ...updated[index], [field]: value };
    setNewTracks(updated);
  };

  const removeTrack = (index: number) => {
    const updated = [...newTracks];
    updated.splice(index, 1);
    setNewTracks(updated);
  };

  return (
    <div className="relative h-[700px] mt-4 rounded border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="bg-white/80 backdrop-blur-md flex flex-col h-full w-full">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-3 border-b border-slate-200 bg-white/50 gap-3 shrink-0">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <MusicIcon className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-700 text-sm">
                Music
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 shrink-0"></div>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide w-full">
              <button onClick={() => setSearchParams({})} className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-xs rounded border transition-colors ${!typeFilter ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200'}`}>전체</button>
              {['앨범', 'EP', '싱글'].map(type => (
                <button key={type} onClick={() => setSearchParams({ type })} className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-xs rounded border transition-colors ${typeFilter === type ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200'}`}>{type}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 shrink-0">
              <button onClick={() => setViewMode('gallery')} className={`p-1 rounded ${viewMode === 'gallery' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400 hover:text-slate-600'}`}>
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400 hover:text-slate-600'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative flex-1 md:flex-none">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색..." className="pl-7 pr-7 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-sky-400 w-full md:w-56 bg-white/80 transition-all" />
            </div>
            <button onClick={() => { setNewItem(initialItem); setNewTracks([]); setActiveTab('info'); setShowAddModal(true); }} className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700 transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /> 발매물 추가
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-slate-50/30">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">로딩 중...</div>
          ) : filteredMusic.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MusicIcon className="w-8 h-8 opacity-20" />
              <span className="text-sm">데이터가 없습니다.</span>
            </div>
          ) : viewMode === 'gallery' ? (
            <div className="p-4 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sortedMusic.map(item => (
                <div key={item.id} onClick={() => openDetailModal(item)} className="bg-white rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-slate-300 transition-all group">
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <MusicIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-[10px]">No Cover</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {item.type}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{item.title}</h3>
                    <p className="text-slate-500 text-xs truncate mt-0.5">{item.artist}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-sky-400 fill-sky-400" />{item.pop_rating}</span>
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-pink-400 fill-pink-400" />{item.love_rating}</span>
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />{item.art_rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            
            <table className="w-full text-left border-collapse text-sm min-w-[800px]">
              <thead>
                <tr className="bg-slate-100/50 text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2 font-medium w-10 text-center cursor-pointer hover:text-slate-700 whitespace-nowrap relative pr-4" onClick={() => handleSort('id')}>ID <SortIcon field="id" absolute /></th>
                  <th className="px-4 py-2 font-medium cursor-pointer hover:text-slate-700 whitespace-nowrap" onClick={() => handleSort('title')}>제목 <SortIcon field="title" /></th>
                  <th className="px-4 py-2 font-medium w-32 cursor-pointer hover:text-slate-700 whitespace-nowrap" onClick={() => handleSort('artist')}>아티스트 <SortIcon field="artist" /></th>
                  <th className="px-4 py-2 font-medium w-20 cursor-pointer hover:text-slate-700 whitespace-nowrap" onClick={() => handleSort('type')}>유형 <SortIcon field="type" /></th>
                  <th className="px-4 py-2 font-medium w-24 cursor-pointer hover:text-slate-700 whitespace-nowrap" onClick={() => handleSort('release_year')}>발매연도 <SortIcon field="release_year" /></th>
                  <th className="px-4 py-2 font-medium w-16 text-center cursor-pointer hover:text-slate-700 whitespace-nowrap relative pr-4" onClick={() => handleSort('pop_rating')}>Pop <SortIcon field="pop_rating" absolute /></th>
                  <th className="px-4 py-2 font-medium w-16 text-center cursor-pointer hover:text-slate-700 whitespace-nowrap relative pr-4" onClick={() => handleSort('love_rating')}>Love <SortIcon field="love_rating" absolute /></th>
                  <th className="px-4 py-2 font-medium w-16 text-center cursor-pointer hover:text-slate-700 whitespace-nowrap relative pr-4" onClick={() => handleSort('art_rating')}>Art <SortIcon field="art_rating" absolute /></th>
                  <th className="px-4 py-2 font-medium w-48 whitespace-nowrap">총평</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedMusic.map(item => (
                  <tr key={item.id} onClick={() => openDetailModal(item)} className="hover:bg-sky-50/50 transition-colors whitespace-nowrap cursor-pointer">
                    <td className="px-4 py-2.5 text-center text-slate-400">{item.id}</td>
                    <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                      {item.cover_image && <img src={item.cover_image} alt="" className="w-6 h-6 rounded object-cover" />}
                      <span>{item.title}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 truncate">{item.artist}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{item.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{item.release_year}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-sky-600">{item.pop_rating}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-pink-600">{item.love_rating}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-emerald-600">{item.art_rating}</td>
                    <td className="px-4 py-2.5 text-slate-400 truncate max-w-[200px]">{item.analysis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] bg-slate-900/20 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <MusicIcon className="w-5 h-5 text-sky-500" />
                {newItem.id ? '발매물 수정' : '새 발매물 추가'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 shrink-0 bg-white">
              <button onClick={() => setActiveTab('info')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>앨범 정보</button>
              <button onClick={() => setActiveTab('tracks')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tracks' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                트랙리스트 <span className="ml-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">{newTracks.length}</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <form id="music-form" onSubmit={handleAddMusic} className="flex flex-col gap-6">
                {activeTab === 'info' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-1 flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-700">커버 이미지 URL</label>
                        <div className="aspect-square bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 overflow-hidden relative group flex items-center justify-center">
                          {newItem.cover_image ? (
                            <img src={newItem.cover_image} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                              <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                              <span className="text-[10px]">No Image</span>
                            </div>
                          )}
                        </div>
                        <input type="text" value={newItem.cover_image} onChange={e => setNewItem({ ...newItem, cover_image: e.target.value })} className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-sky-500" placeholder="https://..." />
                      </div>

                      <div className="md:col-span-3 grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">제목</label>
                          <input type="text" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-sky-500 bg-white" required placeholder="앨범/싱글명" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">아티스트</label>
                          <input type="text" value={newItem.artist} onChange={e => setNewItem({ ...newItem, artist: e.target.value })} className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-sky-500 bg-white" placeholder="아티스트명" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">유형</label>
                          <div className="relative">
                            <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })} className="appearance-none w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-sky-500 bg-white text-slate-700 cursor-pointer">
                              {['앨범', 'EP', '싱글'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">발매연도 / 유통사</label>
                          <div className="flex gap-2">
                            <input type="text" value={newItem.release_year} onChange={e => setNewItem({ ...newItem, release_year: e.target.value })} className="w-1/2 border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-sky-500 bg-white" placeholder="YYYY" />
                            <input type="text" value={newItem.distributor} onChange={e => setNewItem({ ...newItem, distributor: e.target.value })} className="w-1/2 border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-sky-500 bg-white" placeholder="유통사" />
                          </div>
                        </div>

                        <div className="col-span-2 grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pop (대중성)</label>
                            <input type="number" min="0" max="100" value={newItem.pop_rating} onChange={e => setNewItem({ ...newItem, pop_rating: Number(e.target.value) })} className="w-full border border-slate-200 rounded p-1.5 text-sm focus:outline-none focus:border-sky-500 bg-white font-medium text-sky-600" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Love (취향)</label>
                            <input type="number" min="0" max="100" value={newItem.love_rating} onChange={e => setNewItem({ ...newItem, love_rating: Number(e.target.value) })} className="w-full border border-slate-200 rounded p-1.5 text-sm focus:outline-none focus:border-sky-500 bg-white font-medium text-pink-600" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Art (작품성)</label>
                            <input type="number" min="0" max="100" value={newItem.art_rating} onChange={e => setNewItem({ ...newItem, art_rating: Number(e.target.value) })} className="w-full border border-slate-200 rounded p-1.5 text-sm focus:outline-none focus:border-sky-500 bg-white font-medium text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">기획 / 컨셉 (Concept)</label>
                        <textarea value={newItem.concept} onChange={e => setNewItem({ ...newItem, concept: e.target.value })} className="w-full border border-slate-200 rounded p-3 text-sm focus:outline-none focus:border-sky-500 min-h-[100px] bg-white resize-none" placeholder="앨범 기획 의도 및 컨셉 코멘트..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">앨범 총평 (Analysis)</label>
                        <textarea value={newItem.analysis} onChange={e => setNewItem({ ...newItem, analysis: e.target.value })} className="w-full border border-slate-200 rounded p-3 text-sm focus:outline-none focus:border-sky-500 min-h-[100px] bg-white resize-none" placeholder="앨범 전체에 대한 A&R 총평..." />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'tracks' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">트랙의 세부 정보를 입력하세요. (타이틀 곡은 체크 표시)</p>
                      <button type="button" onClick={addEmptyTrack} className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 text-xs rounded border border-sky-200 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> 트랙 추가
                      </button>
                    </div>

                    {newTracks.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-sm">등록된 트랙이 없습니다.</div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {newTracks.map((track, i) => (
                          <div key={i} className="flex flex-col bg-white border border-slate-200 rounded-lg p-3 shadow-sm relative">
                            <button type="button" onClick={() => removeTrack(i)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex gap-3 items-center mb-3 pr-8">
                              <input type="number" value={track.track_number} onChange={e => updateTrack(i, 'track_number', Number(e.target.value))} className="w-12 border border-slate-200 rounded p-1 text-center text-sm focus:outline-none focus:border-sky-500 bg-slate-50" placeholder="#" />
                              <input type="text" value={track.title} onChange={e => updateTrack(i, 'title', e.target.value)} className="flex-1 border border-slate-200 rounded p-1.5 text-sm focus:outline-none focus:border-sky-500 font-medium" placeholder="트랙 제목" />
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                                <input type="checkbox" checked={track.is_title_track} onChange={e => updateTrack(i, 'is_title_track', e.target.checked)} className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500" />
                                타이틀
                              </label>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3 items-end">
                              <MultiSelectInput label="" placeholder="작곡" value={track.composer || ''} onChange={v => updateTrack(i, 'composer', v)} existingOptions={options.composers} />
                              <MultiSelectInput label="" placeholder="작사" value={track.lyricist || ''} onChange={v => updateTrack(i, 'lyricist', v)} existingOptions={options.lyricists} />
                              <MultiSelectInput label="" placeholder="편곡" value={track.arranger || ''} onChange={v => updateTrack(i, 'arranger', v)} existingOptions={options.arrangers} />
                              <MultiSelectInput label="" placeholder="장르" value={track.genre || ''} onChange={v => updateTrack(i, 'genre', v)} existingOptions={options.genres} />
                              <MultiSelectInput label="" placeholder="BPM" value={track.bpm || ''} onChange={v => updateTrack(i, 'bpm', v)} existingOptions={options.bpms} />
                            </div>

                            <div className="flex gap-3">
                              <div className="flex bg-slate-50 rounded border border-slate-200 overflow-hidden shrink-0">
                                <input type="number" value={track.pop_rating} onChange={e => updateTrack(i, 'pop_rating', Number(e.target.value))} className="w-10 bg-transparent text-center text-xs p-1 focus:outline-none text-sky-600 font-semibold border-r border-slate-200" placeholder="Pop" title="Pop" />
                                <input type="number" value={track.love_rating} onChange={e => updateTrack(i, 'love_rating', Number(e.target.value))} className="w-10 bg-transparent text-center text-xs p-1 focus:outline-none text-pink-600 font-semibold border-r border-slate-200" placeholder="Luv" title="Love" />
                                <input type="number" value={track.art_rating} onChange={e => updateTrack(i, 'art_rating', Number(e.target.value))} className="w-10 bg-transparent text-center text-xs p-1 focus:outline-none text-emerald-600 font-semibold" placeholder="Art" title="Art" />
                              </div>
                              <input type="text" value={track.analysis} onChange={e => updateTrack(i, 'analysis', e.target.value)} className="flex-1 border border-slate-200 rounded p-1.5 text-xs focus:outline-none focus:border-sky-500" placeholder="트랙 코멘트..." />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">취소</button>
              <button type="submit" form="music-form" className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded shadow-sm hover:bg-sky-600 transition-colors">{newItem.id ? '수정 내용 저장' : '발매물 등록'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMusic && (
        <div className="fixed top-0 right-0 w-[450px] h-screen bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col z-[100] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-sky-100 text-sky-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{selectedMusic.type}</div>
                <h2 className="text-xl font-bold text-slate-800 m-0">{selectedMusic.title}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditClick(selectedMusic)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">수정</button>
                <button onClick={() => handleDeleteMusic(selectedMusic.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors">삭제</button>
                <button onClick={() => setSelectedMusic(null)} className="ml-2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 flex flex-col gap-6">

                {/* Top Section: Album Info */}
                <div className="flex flex-col gap-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex gap-4">
                    <div className="w-28 h-28 bg-slate-100 rounded-lg overflow-hidden shadow-sm shrink-0">
                      {selectedMusic.cover_image ? (
                        <img src={selectedMusic.cover_image} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon className="w-8 h-8 opacity-50" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-900 truncate">{selectedMusic.title}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">{selectedMusic.artist}</p>
                      
                      <div className="flex items-center gap-3 mt-3 text-sm font-bold">
                        <span className="flex items-center gap-1 text-sky-600"><Star className="w-4 h-4 text-sky-400 fill-sky-400" />{selectedMusic.pop_rating}</span>
                        <span className="flex items-center gap-1 text-pink-600"><Star className="w-4 h-4 text-pink-400 fill-pink-400" />{selectedMusic.love_rating}</span>
                        <span className="flex items-center gap-1 text-emerald-600"><Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />{selectedMusic.art_rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>{selectedMusic.release_year}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{selectedMusic.distributor || '유통사 미상'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>총 {musicTracks.length} 트랙</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {selectedMusic.concept && (
                      <div className="bg-slate-50 p-3 rounded text-xs text-slate-700 whitespace-pre-wrap border border-slate-100">
                        <span className="font-bold text-slate-400 block mb-1">기획 / 컨셉</span>
                        {selectedMusic.concept}
                      </div>
                    )}
                    {selectedMusic.analysis && (
                      <div className="bg-slate-50 p-3 rounded text-xs text-slate-700 whitespace-pre-wrap border border-slate-100">
                        <span className="font-bold text-slate-400 block mb-1">앨범 총평</span>
                        {selectedMusic.analysis}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Vertical Tracklist */}
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 px-1">
                    <List className="w-4 h-4 text-sky-500" />
                    트랙리스트
                  </h3>

                  <div className="flex flex-col gap-2">
                    {musicTracks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">등록된 트랙이 없습니다.</div>
                    ) : (
                      musicTracks.map(track => (
                        <div key={track.id} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-sky-200 transition-colors">
                          <div className="font-bold text-slate-300 w-4 pt-0.5 text-center">{track.track_number}</div>
                          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                            <div className="font-bold text-slate-800 text-sm flex items-center gap-2 truncate">
                              {track.title}
                              {track.is_title_track && <span className="bg-sky-100 text-sky-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">Title</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-2 gap-y-1">
                              {track.genre && <span className="bg-slate-100 px-1.5 py-0.5 rounded">{track.genre}</span>}
                              {track.composer && <span><span className="text-slate-400">작곡</span> {track.composer}</span>}
                              {track.lyricist && <span><span className="text-slate-400">작사</span> {track.lyricist}</span>}
                              {track.arranger && <span><span className="text-slate-400">편곡</span> {track.arranger}</span>}
                              {track.bpm && <span><span className="text-slate-400">BPM</span> {track.bpm}</span>}
                            </div>
                            {track.analysis && <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-0.5 border border-slate-100">{track.analysis}</div>}
                          </div>
                          <div className="flex flex-col gap-1 items-end text-[10px] font-medium shrink-0 pt-0.5">
                            <span className="text-sky-600 flex items-center gap-1"><Star className="w-3 h-3 text-sky-400 fill-sky-400" /> {track.pop_rating}</span>
                            <span className="text-pink-600 flex items-center gap-1"><Star className="w-3 h-3 text-pink-400 fill-pink-400" /> {track.love_rating}</span>
                            <span className="text-emerald-600 flex items-center gap-1"><Star className="w-3 h-3 text-emerald-400 fill-emerald-400" /> {track.art_rating}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
        </div>
      )}
    </div>
  );
}
