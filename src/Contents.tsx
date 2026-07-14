// Trigger Vite HMR
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, Search, X, ChevronDown, ChevronUp } from 'lucide-react';

type ContentItem = {
  [x: string]: any;
  id: number;
  title: string;
  type: string;
  status: string;
  rating: number;
  platform: string;
  series_name: string | null;
  progress: string;
  watched_at: string;
  publication_status?: string;
  release_year?: string;
  tags?: string;
  review?: string;
};

const BADGE_CLASS = "bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-[1px] text-[10px] border border-slate-200 shrink-0 inline-flex items-center justify-center leading-none h-[22px]";


import { useRef } from 'react';

const MultiSelectInput = ({ 
  label, 
  value, 
  onChange, 
  existingOptions 
}: { 
  label: string, 
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
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div 
        className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all flex flex-wrap gap-1 bg-white cursor-text min-h-[38px] items-center"
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
          className="flex-1 min-w-[60px] outline-none text-sm bg-transparent h-6" 
          placeholder={selectedItems.length === 0 ? "입력 후 엔터..." : ""} 
        />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto z-50 p-2 flex flex-col gap-2">
          {inputValue && !existingOptions.includes(inputValue.trim()) && !selectedItems.includes(inputValue.trim()) && (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); handleAdd(inputValue); inputRef.current?.focus(); }} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 rounded flex items-center gap-2">
              <span className="font-semibold text-sky-500">생성</span> "{inputValue}"
            </button>
          )}
          <div className="flex flex-wrap gap-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <button type="button" key={opt} onMouseDown={(e) => { e.preventDefault(); handleAdd(opt); inputRef.current?.focus(); }} className="px-2 py-0.5 bg-white border border-slate-200 rounded-[1px] text-[10px] text-slate-500 hover:bg-slate-50">
                {opt}
              </button>
            ))
          ) : (
            !inputValue && <div className="px-1 py-1 text-xs text-slate-400">옵션이 없습니다.</div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Contents() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get('type');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    type: '웹툰',
    status: '보는중',
    rating: 0,
    platform: '',
    progress: '',
    watched_at: '',
    publication_status: '연재중',
    release_year: '',
    tags: '',
    review: '',
    part_number: ''
  });

  const [relatedContentId, setRelatedContentId] = useState('');
  const [relationType, setRelationType] = useState('관련작');
    const [selectedRelations, setSelectedRelations] = useState<{target_id: number, target_title: string, relation_type: string}[]>([]);
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);

  const existingTags = Array.from(new Set(contents.flatMap(c => (c.tags || '').split(',').map(t => t.trim())).filter(Boolean)));
  const existingPlatforms = Array.from(new Set(contents.flatMap(c => (c.platform || '').split(',').map(p => p.trim())).filter(Boolean)));

  const handleAddRelation = () => {
    if (!relatedContentId) return;
    const target = contents.find(c => c.id === Number(relatedContentId));
    if (target) {
      const existingIdx = selectedRelations.findIndex(rel => rel.target_id === target.id);
      if (existingIdx >= 0) {
        alert("이미 추가된 작품입니다.");
      } else {
        setSelectedRelations([...selectedRelations, { target_id: target.id, target_title: target.title, relation_type: relationType }]);
      }
      setRelatedContentId('');
    }
  };

  const handleRemoveRelation = (idx: number) => {
    const newRels = [...selectedRelations];
    newRels.splice(idx, 1);
    setSelectedRelations(newRels);
  };

    const getDisambiguation = (item: ContentItem) => {
    const duplicates = contents.filter(c => c.id !== item.id && c.title === item.title);
    if (duplicates.length === 0) return null;
    const sameType = duplicates.some(c => c.type === item.type);
    if (!sameType) return item.type;
    if (item.release_year) {
      const sameYear = duplicates.some(c => c.release_year === item.release_year);
      if (!sameYear) return item.release_year;
      return `${item.type}, ${item.release_year}`;
    }
    return item.type;
  };

  useEffect(() => {
    // 백엔드 API 연결
    fetch('/api/contents')
      .then(res => res.json())
      .then(data => {
        setContents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch contents:', err);
        // 백엔드 실행 전이라면 더미 데이터 렌더링
        setContents([
          { id: 1, title: '해 뜨는 집', type: '웹툰', status: '완주', rating: 9, platform: '네이버', series_name: null, progress: '', watched_at: '2023' },
          { id: 2, title: '영광의 헤일로', type: '웹소설', status: '보는중', rating: 10, platform: '시리즈', series_name: null, progress: '231/231', watched_at: '2026' },
          { id: 3, title: '코라의 전설', type: '애니', status: '완주', rating: 8, platform: '넷플릭스', series_name: '아앙의 전설', progress: '', watched_at: '2012' },
          { id: 4, title: '아앙의 전설', type: '애니', status: '완주', rating: 10, platform: '넷플릭스', series_name: '코라의 전설', progress: '', watched_at: '2005' },
        ]);
        setLoading(false);
      });
  }, []);

  const getStatusBadge = (status: string) => {
    return <span className={BADGE_CLASS}>{status}</span>;
  };

  const getTypeBadge = (type: string) => {
    return <span className={BADGE_CLASS}>{type}</span>;
  };

  const getClickableBadge = (value: string | number | undefined | null) => {
    if (!value && value !== 0) return <span className="text-slate-300">-</span>;
    return (
      <button 
        type="button" 
        onClick={(e) => { e.stopPropagation(); setSearchQuery(value.toString().trim()); }} 
        className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-[1px] text-[10px] border border-slate-200 shrink-0 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors cursor-pointer max-w-full truncate"
      >
        {value.toString()}
      </button>
    );
  };

  
  const filteredContents = useMemo(() => {
    let result = contents;
    if (typeFilter) {
      result = result.filter(c => c.type === typeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.tags && c.tags.toLowerCase().includes(q)) ||
        (c.platform && c.platform.toLowerCase().includes(q)) ||
        (c.review && c.review.toLowerCase().includes(q)) ||
        (c.status && c.status.toLowerCase().includes(q)) ||
        (c.type && c.type.toLowerCase().includes(q)) ||
        (c.publication_status && c.publication_status.toLowerCase().includes(q)) ||
        (c.release_year && c.release_year.toString().toLowerCase().includes(q)) ||
        (c.rating !== undefined && c.rating !== null && c.rating.toString().toLowerCase().includes(q)) ||
        (c.progress && c.progress.toLowerCase().includes(q)) ||
        (c.watched_at && c.watched_at.toLowerCase().includes(q))
      );
    }
    return result;
  }, [contents, typeFilter, searchQuery]);

  const [sortConfig, setSortConfig] = useState<{ key: keyof ContentItem; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: keyof ContentItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedContents = useMemo(() => {
    let sortableItems = [...filteredContents];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredContents, sortConfig]);
  
  const getSortIcon = (key: keyof ContentItem, absolute?: boolean) => {
    if (!sortConfig || sortConfig.key !== key) return absolute ? null : <ChevronDown className="w-3 h-3 inline-block ml-1 opacity-0" />;
    const Icon = sortConfig.direction === 'asc' ? ChevronUp : ChevronDown;
    const baseClass = "w-3 h-3 text-sky-500 " + (absolute ? "absolute right-1 top-1/2 -translate-y-1/2" : "inline-block ml-1");
    return <Icon className={baseClass} />;
  };

  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [contentRelations, setContentRelations] = useState<any[]>([]);

  const openDetailModal = async (item: ContentItem) => {
    setSelectedContent(item);
    try {
      const res = await fetch(`/api/contents/${item.id}/relations`);
      const data = await res.json();
      setContentRelations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContent = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/contents/${id}`, { method: 'DELETE' });
      setContents(contents.filter(c => c.id !== id));
      if (selectedContent?.id === id) setSelectedContent(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (item: ContentItem) => {
    setNewItem(item as any);
    setSelectedRelations(contentRelations.map(rel => ({
      target_id: rel.source_id === item.id ? rel.target_id : rel.source_id,
      target_title: rel.title,
      relation_type: rel.source_id === item.id ? rel.relation_type : (rel.relation_type === '원작' ? '파생작' : rel.relation_type === '파생작' ? '원작' : rel.relation_type === '이전작' ? '후속작' : rel.relation_type === '후속작' ? '이전작' : rel.relation_type)
    })));
    setSelectedContent(null);
    setShowAddModal(true);
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;
    try {
      let newId = (newItem as any).id;
      if (newId) {
        await fetch(`/api/contents/${newId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        await fetch(`/api/contents/${newId}/relations`, { method: 'DELETE' });
      } else {
        const res = await fetch('/api/contents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        const data = await res.json();
        newId = data.id;
      }

      for (const rel of selectedRelations) {
        await fetch('/api/content_relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_id: newId, target_id: rel.target_id, relation_type: rel.relation_type })
        });
      }

      setShowAddModal(false);
      setNewItem({ title: '', type: '웹툰', status: '보는중', rating: 0, platform: '', progress: '', watched_at: '', publication_status: '연재중', release_year: '', tags: '', review: '', part_number: '' } as any);
      setSelectedRelations([]);
      
      const res2 = await fetch('/api/contents');
      const data2 = await res2.json();
      setContents(data2);
      
      if (newId) {
        const updatedItem = data2.find((c: any) => c.id === newId);
        if (updatedItem && selectedContent?.id === newId) {
           openDetailModal(updatedItem);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative h-[70vh] md:h-[700px] mt-4 rounded border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-white/80 backdrop-blur-md flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 border-b border-slate-200 bg-white/50 gap-3">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-700 text-sm">
              Contents
            </span>
          </div>
          
          <div className="h-4 w-px bg-slate-200 shrink-0"></div>
          
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide w-full">
            <button onClick={() => setSearchParams({})} className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-xs rounded border transition-colors ${!typeFilter ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200'}`}>전체</button>
            {['웹툰', '웹소설', '애니', '영화', '드라마', '만화', '소설', '전대물'].map(type => (
              <button key={type} onClick={() => setSearchParams({type})} className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-xs rounded border transition-colors ${typeFilter === type ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200'}`}>{type}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}  className="pl-7 pr-7 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-sky-400 w-full md:w-56 bg-white/80 transition-all" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3"/></button>}
          </div>
          <button onClick={() => {
            setSelectedContent(null);
            setNewItem({ title: '', type: '웹툰', status: '보는중', rating: 0, platform: '', progress: '', watched_at: '', publication_status: '연재중', release_year: '', tags: '', review: '', part_number: '' } as any);
            setSelectedRelations([]);
            setShowAddModal(true);
          }} className="shrink-0 whitespace-nowrap flex items-center gap-1 bg-sky-500 text-white px-3 py-1.5 rounded text-xs hover:bg-sky-600 transition-colors shadow-sm">
            <Plus className="w-3 h-3" />
            새로 만들기
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[800px]">
          <thead className="bg-white/90 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-medium whitespace-nowrap shadow-sm">
            <tr>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-40 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('title')}>Aa 제목 {getSortIcon('title')}</th>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-20 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('type')}>유형 {getSortIcon('type')}</th>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-20 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('status')}>상태 {getSortIcon('status')}</th>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-20 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('publication_status')}>연재상태 {getSortIcon('publication_status')}</th>
              <th className="font-normal px-2 py-2 border-r border-slate-200 w-12 text-center cursor-pointer hover:bg-slate-50 transition-colors relative pr-4" onClick={() => requestSort('rating')}>평점 {getSortIcon('rating', true)}</th>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-28 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('tags')}>장르/태그 {getSortIcon('tags')}</th>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-16 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('release_year')}>공개일 {getSortIcon('release_year')}</th>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-24 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('platform')}>플랫폼 {getSortIcon('platform')}</th>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-24 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('review')}>자유 감상/메모 {getSortIcon('review')}</th>
              <th className="font-normal px-3 py-2 border-r border-slate-200 w-16 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('progress')}>진행도 {getSortIcon('progress')}</th>
              <th className="font-normal px-3 py-2 w-28 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => requestSort('watched_at')}>감상일 {getSortIcon('watched_at')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 bg-white/60">
            {loading ? (
              <tr><td colSpan={11} className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : sortedContents.length === 0 ? (
              <tr><td colSpan={11} className="p-8 text-center text-slate-400">데이터가 없습니다.</td></tr>
            ) : (
              sortedContents.map((item) => (
                <tr key={item.id} onClick={() => openDetailModal(item)} className="hover:bg-sky-50/50 transition-colors whitespace-nowrap cursor-pointer">
                  <td className="px-3 py-1.5 border-r border-slate-100 font-medium max-w-[160px] truncate">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="truncate">
                        {item.title}
                        {getDisambiguation(item) && <span className="text-slate-400 text-[11px] shrink-0 ml-1">({getDisambiguation(item)})</span>}
                        {item.part_number ? <span className="text-sky-500 font-bold shrink-0 text-[10px] bg-sky-50 px-1 rounded ml-1">#{item.part_number}</span> : null}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-100 max-w-[80px] truncate">
                    {getClickableBadge(item.type)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-100 max-w-[80px] truncate">
                    {getClickableBadge(item.status)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-100 max-w-[80px] truncate">
                    {getClickableBadge(item.publication_status)}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-100 text-center text-slate-600 max-w-[48px] truncate">
                    {getClickableBadge(item.rating)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-100 max-w-[112px] truncate">
                    <div className="flex flex-nowrap gap-1 overflow-hidden">
                      {item.tags?.split(',').filter(Boolean).map(t => (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSearchQuery(t.trim()); }} key={t} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-[1px] text-[10px] border border-slate-200 shrink-0 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors cursor-pointer">{t.trim()}</button>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-100 text-xs text-slate-500 max-w-[64px] truncate">
                    {getClickableBadge(item.release_year)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-100 max-w-[112px] truncate">
                    <div className="flex flex-nowrap gap-1 overflow-hidden">
                      {item.platform?.split(',').filter(Boolean).map(p => (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSearchQuery(p.trim()); }} key={p} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded-[1px] text-[10px] border border-slate-200 shrink-0 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors cursor-pointer">{p.trim()}</button>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-100 max-w-[96px] truncate text-xs text-slate-500">
                    {item.review || '-'}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-100 text-xs text-slate-600 max-w-[64px] truncate">
                    {getClickableBadge(item.progress)}
                  </td>
                  <td className="px-3 py-1.5 text-xs text-slate-500 max-w-[112px] truncate">
                    {getClickableBadge(item.watched_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[110] bg-slate-900/20 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-800">{(newItem as any).id ? "콘텐츠 수정" : "새 콘텐츠 추가"}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleAddContent} className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">제목 <span className="text-rose-500">*</span></label>
                  <input required type="text" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">편수(시리즈)</label>
                  <div className="relative">
                    <input type="number" min="1" value={newItem.part_number || ''} onChange={e => setNewItem({...newItem, part_number: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-right pr-6"  />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">편</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">유형</label>
                  <div className="relative">
                    <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="appearance-none w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 bg-white text-slate-700 cursor-pointer pr-8">
                      {['웹툰', '웹소설', '애니', '영화', '드라마', '만화', '소설', '전대물'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">상태</label>
                  <div className="relative">
                    <select value={newItem.status} onChange={e => setNewItem({...newItem, status: e.target.value})} className="appearance-none w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 bg-white text-slate-700 cursor-pointer pr-8">
                      {['보는중', '완주', '보류', '하차'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">연재상태</label>
                  <div className="relative">
                    <select value={newItem.publication_status} onChange={e => setNewItem({...newItem, publication_status: e.target.value})} className="appearance-none w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 bg-white text-slate-700 cursor-pointer pr-8">
                      {['연재중', '완결', '휴재', '미정'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <MultiSelectInput 
                  label="플랫폼" 
                   
                  value={newItem.platform} 
                  onChange={v => setNewItem({...newItem, platform: v})} 
                  existingOptions={existingPlatforms} 
                />
                <MultiSelectInput 
                  label="장르/태그" 
                   
                  value={newItem.tags || ''} 
                  onChange={v => setNewItem({...newItem, tags: v})} 
                  existingOptions={existingTags} 
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">진행도</label>
                  <input type="text" value={newItem.progress} onChange={e => setNewItem({...newItem, progress: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">평점 (10점 만점)</label>
                  <input type="number" min="0" max="10" value={newItem.rating} onChange={e => setNewItem({...newItem, rating: e.target.value === '' ? ('' as any) : Number(e.target.value)})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    공개일(년도)
                  </label>
                  <input type="number" min="1900" max="2100" value={newItem.release_year} onChange={e => setNewItem({...newItem, release_year: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"  />
                </div>
                <div className="flex-1">
                  <label className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                    감상일
                    <button type="button" onClick={() => setNewItem({...newItem, watched_at: ''})} className="text-rose-400 hover:text-rose-500 text-[10px] font-medium bg-rose-50 px-1.5 py-0.5 rounded">지우기</button>
                  </label>
                  <input 
                    type={newItem.watched_at ? "date" : "text"} 
                    onFocus={(e) => e.target.type = "date"}
                    onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                    value={newItem.watched_at || ''} 
                    onChange={e => setNewItem({...newItem, watched_at: e.target.value})} 
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all" 
                    
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">자유 감상/메모</label>
                <textarea value={newItem.review || ''} onChange={e => setNewItem({...newItem, review: e.target.value})} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all h-24 resize-none" ></textarea>
              </div>


              {/* 연관 작품 섹션 */}
              <div className="border-t border-slate-100 pt-3 mt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-2">연관 작품 연결</label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <select value={relatedContentId} onChange={e => setRelatedContentId(e.target.value)} className="appearance-none w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 bg-white text-slate-700 cursor-pointer pr-8">
                      <option value="">작품 선택...</option>
                      {contents.map(c => <option key={c.id} value={c.id}>{c.title} ({c.type})</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative w-32">
                    <select value={relationType} onChange={e => setRelationType(e.target.value)} className="appearance-none w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-500 bg-white text-slate-700 cursor-pointer pr-8">
                      {['원작', '파생작', '이전작', '후속작', '스핀오프', '관련작', '시리즈'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <button type="button" onClick={handleAddRelation} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm transition-colors shrink-0">추가</button>
                </div>
                {selectedRelations.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    {selectedRelations.map((rel, idx) => (
                      <div key={idx} onClick={() => setOpenDropdownIdx(openDropdownIdx === idx ? null : idx)} className={`flex justify-between items-center text-xs bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-[1px] relative hover:bg-slate-100 transition-colors group cursor-pointer ${openDropdownIdx === idx ? 'z-50' : 'z-10'}`}>
                        <span className="text-slate-700 flex items-center gap-1">
                          <span className="text-sky-500 font-semibold">[{rel.relation_type}]</span>
                          <span className="truncate">
                            {rel.target_title}
                            {(() => {
                              const target = contents.find(c => c.id === rel.target_id);
                              const dis = target ? getDisambiguation(target) : null;
                              return dis ? <span className="text-slate-400 text-[10px] ml-1">({dis})</span> : null;
                            })()}
                          </span>
                        </span>
                        
                        {openDropdownIdx === idx && (
                          <div className="absolute left-0 top-full mt-1 w-24 bg-white border border-slate-200 shadow-lg rounded z-[120] py-1">
                            {['원작', '파생작', '이전작', '후속작', '스핀오프', '관련작', '시리즈'].map(t => (
                              <button 
                                type="button"
                                key={t}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newRels = [...selectedRelations];
                                  newRels[idx] = { ...newRels[idx], relation_type: t };
                                  setSelectedRelations(newRels);
                                  setOpenDropdownIdx(null);
                                }}
                                className="block w-full text-left px-3 py-1.5 text-[11px] text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                              >
                                [{t}]
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveRelation(idx); }} className="text-slate-400 hover:text-rose-500 relative z-10 p-1"><X className="w-3.5 h-3.5"/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors">취소</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded transition-colors">{(newItem as any).id ? "수정하기" : "추가하기"}</button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      </div>
      {selectedContent && createPortal(
        <div className="fixed top-0 right-0 w-full md:w-[450px] h-screen bg-white shadow-2xl border-l border-slate-200 flex flex-col z-[100] animate-in slide-in-from-right duration-300">
          <div className="p-6 overflow-y-auto h-full flex-1">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-slate-800 break-keep leading-tight pr-24">{selectedContent.title}</h2>
              <div className="absolute right-6 top-6 flex items-center gap-1">
                <button onClick={() => handleEditClick(selectedContent)} className="text-slate-400 hover:text-sky-500 bg-slate-50 hover:bg-sky-50 p-1.5 rounded transition-colors text-xs font-medium">수정</button>
                <button onClick={() => handleDeleteContent(selectedContent.id)} className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-1.5 rounded transition-colors text-xs font-medium">삭제</button>
                <button onClick={() => setSelectedContent(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded transition-colors ml-1"><X className="w-4 h-4"/></button>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 text-sm mb-8">
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>유형</div>
                <div className="flex-1 text-slate-700">{getTypeBadge(selectedContent.type)}</div>
              </div>
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>상태</div>
                <div className="flex-1 text-slate-700 flex items-center gap-2">
                  {getStatusBadge(selectedContent.status)}
                  {getClickableBadge(selectedContent.publication_status)}
                </div>
              </div>
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>장르/태그</div>
                <div className="flex-1 text-slate-700 flex flex-wrap gap-1">
                  {selectedContent.tags?.split(',').filter(Boolean).map(t => (
                    <button type="button" onClick={() => { setSearchQuery(t.trim()); setSelectedContent(null); }} key={t} className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded-[1px] text-[11px] border border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors cursor-pointer">{t.trim()}</button>
                  )) || <span className="text-slate-300">-</span>}
                </div>
              </div>
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>플랫폼</div>
                <div className="flex-1 text-slate-700 flex flex-wrap gap-1">
                  {selectedContent.platform?.split(',').filter(Boolean).map(p => (
                    <button type="button" onClick={() => { setSearchQuery(p.trim()); setSelectedContent(null); }} key={p} className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded-[1px] text-[11px] border border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors cursor-pointer">{p.trim()}</button>
                  )) || <span className="text-slate-300">-</span>}
                </div>
              </div>
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>평점</div>
                <div className="flex-1 text-slate-700 font-medium">{selectedContent.rating ? `${selectedContent.rating} / 10` : '-'}</div>
              </div>
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>진행도</div>
                <div className="flex-1 text-slate-700">{getClickableBadge(selectedContent.progress)}</div>
              </div>
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>공개일</div>
                <div className="flex-1 text-slate-700">{getClickableBadge(selectedContent.release_year)}</div>
              </div>
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>감상일</div>
                <div className="flex-1 text-slate-700">{getClickableBadge(selectedContent.watched_at)}</div>
              </div>
              <div className="flex py-1.5 border-b border-slate-50">
                <div className="w-36 text-slate-400 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-300"/>자유 감상/메모</div>
                <div className="flex-1 text-slate-700 whitespace-pre-wrap">{selectedContent.review || '-'}</div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400"/>
                연관 작품
              </h3>
              {contentRelations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contentRelations.map(rel => {
                    const isSource = rel.source_id === selectedContent.id;
                    let relationLabel = rel.relation_type;
                    if (!isSource) {
                      if (relationLabel === '원작') relationLabel = '파생작';
                      else if (relationLabel === '파생작') relationLabel = '원작';
                      else if (relationLabel === '이전작') relationLabel = '후속작';
                      else if (relationLabel === '후속작') relationLabel = '이전작';
                    }
                    return (
                      <div key={rel.relation_id} className="flex flex-col gap-1 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded transition-colors cursor-pointer" onClick={() => {
                        const targetItem = contents.find(c => c.id === (isSource ? rel.target_id : rel.source_id));
                        if (targetItem) openDetailModal(targetItem);
                      }}>
                        <span className="text-[10px] font-semibold text-sky-500">{relationLabel}</span>
                        <span className="text-xs text-slate-700 font-medium truncate">{rel.title}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-400 bg-slate-50 p-4 rounded text-center">연관된 작품이 없습니다.</div>
              )}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
