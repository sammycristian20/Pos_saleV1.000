import React from 'react';

interface CategoryTabsProps {
  categories: { id: string; name: string }[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="mb-6 border-b border-gray-200">
      <div className="flex overflow-x-auto no-scrollbar">
        <button
          onClick={() => onCategoryChange('')}
          className={`px-4 py-2 whitespace-nowrap font-medium text-sm border-b-2 transition-colors duration-200 ${
            activeCategory === ''
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-4 py-2 whitespace-nowrap font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeCategory === category.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;