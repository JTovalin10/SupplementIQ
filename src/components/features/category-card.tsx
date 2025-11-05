import Link from "next/link";

import { Category } from "@/lib/config/data/categories";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={category.href}>
      <div className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div
            className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-white text-2xl`}
          >
            {category.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {category.name}
            </h3>
            <p className="text-gray-600 text-sm mt-1">{category.description}</p>
            <div className="flex items-center mt-2">
              <span className="text-xs text-gray-500">
                {category.productCount.toLocaleString()} products
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
