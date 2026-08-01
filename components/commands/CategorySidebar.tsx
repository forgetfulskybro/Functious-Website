'use client';

import type { Category } from '@/data/commands';
import { CATEGORY_LABELS } from '@/data/commands';

type SidebarCategory = Category | 'all';

interface CategorySidebarProps {
  active: SidebarCategory;
  onChangeAction: (cat: SidebarCategory) => void;
}

export default function CategorySidebar({
  active,
  onChangeAction,
}: CategorySidebarProps) {
  const categories: SidebarCategory[] = [
    'all',
    'roles',
    'giveaways-polls',
    'scheduling',
    'utility',
    'server-management',
  ];

  const getCategoryLabel = (cat: SidebarCategory): string => {
    return cat === 'all' ? 'All Commands' : CATEGORY_LABELS[cat];
  };

  const renderButton = (cat: SidebarCategory) => {
    const isActive = active === cat;

    return (
      <button
        key={cat}
        onClick={() => onChangeAction(cat)}
        className={`
          whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange
          ${
            isActive
              ? 'bg-orange text-white'
              : 'bg-bg-card text-white/70 hover:bg-white/5 hover:text-white'
          }
        `}
        aria-current={isActive ? 'page' : undefined}
      >
        {getCategoryLabel(cat)}
      </button>
    );
  };

  return (
    <>
      <nav
        className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden"
        aria-label="Filter commands by category"
      >
        {categories.map(renderButton)}
      </nav>

      <aside
        className="sticky top-20 hidden h-fit flex-col gap-2 md:flex"
        aria-label="Filter commands by category"
      >
        {categories.map(renderButton)}
      </aside>
    </>
  );
}
