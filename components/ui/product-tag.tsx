'use client'

import React from 'react'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

export interface Tag {
  id: number
  name: string
  color: string
}

interface ProductTagProps {
  tag: Tag
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export function ProductTag({
  tag,
  size = 'sm',
  variant = 'default',
  className,
  onClick,
  style
}: ProductTagProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const baseStyle = {
    backgroundColor: variant === 'default' ? tag.color : 'transparent',
    borderColor: tag.color,
    color: variant === 'default' ? '#ffffff' : tag.color,
    ...style
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        sizeClasses[size],
        'font-medium transition-all duration-200 hover:scale-105 cursor-pointer border',
        onClick && 'hover:shadow-md',
        className
      )}
      style={baseStyle}
      onClick={onClick}
    >
      {tag.name}
    </Badge>
  )
}

interface ProductTagListProps {
  tags: Tag[]
  maxTags?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
  onTagClick?: (tag: Tag) => void
  showMore?: boolean
}

export function ProductTagList({
  tags,
  maxTags = 5,
  size = 'sm',
  variant = 'default',
  className,
  onTagClick,
  showMore = true
}: ProductTagListProps) {
  const [showAll, setShowAll] = React.useState(false)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }
  
  const displayTags = showAll ? tags : tags.slice(0, maxTags)
  const hasMoreTags = tags.length > maxTags

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayTags.map((tag) => (
        <ProductTag
          key={tag.id}
          tag={tag}
          size={size}
          variant={variant}
          onClick={() => onTagClick?.(tag)}
        />
      ))}
      
      {hasMoreTags && !showAll && showMore && (
        <Badge
          variant="outline"
          className={cn(
            sizeClasses[size],
            'text-muted-foreground border-dashed cursor-pointer hover:bg-muted'
          )}
          onClick={() => setShowAll(true)}
        >
          +{tags.length - maxTags} více
        </Badge>
      )}
      
      {showAll && hasMoreTags && showMore && (
        <Badge
          variant="outline"
          className={cn(
            sizeClasses[size],
            'text-muted-foreground border-dashed cursor-pointer hover:bg-muted'
          )}
          onClick={() => setShowAll(false)}
        >
          Méně
        </Badge>
      )}
    </div>
  )
}

// Tag filter component for search/filter functionality
interface TagFilterProps {
  tags: Tag[]
  selectedTags: Tag[]
  onTagToggle: (tag: Tag) => void
  className?: string
}

export function TagFilter({ tags, selectedTags, onTagToggle, className }: TagFilterProps) {
  const isSelected = (tag: Tag) => selectedTags.some(t => t.id === tag.id)

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <ProductTag
          key={tag.id}
          tag={tag}
          size="md"
          variant={isSelected(tag) ? 'default' : 'outline'}
          onClick={() => onTagToggle(tag)}
          className={cn(
            'transition-all duration-200',
            isSelected(tag) && 'ring-2 ring-offset-2',
          )}
          style={isSelected(tag) ? { '--tw-ring-color': tag.color } as React.CSSProperties : undefined}
        />
      ))}
    </div>
  )
}

// Tag category grouping component
interface TagCategoryProps {
  title: string
  tags: Tag[]
  selectedTags: Tag[]
  onTagToggle: (tag: Tag) => void
  collapsible?: boolean
  defaultExpanded?: boolean
}

export function TagCategory({ 
  title, 
  tags, 
  selectedTags, 
  onTagToggle,
  collapsible = true,
  defaultExpanded = true 
}: TagCategoryProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  if (tags.length === 0) return null

  return (
    <div className="space-y-3">
      <div 
        className={cn(
          'flex items-center justify-between',
          collapsible && 'cursor-pointer'
        )}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
        {collapsible && (
          <span className="text-muted-foreground">
            {isExpanded ? '−' : '+'}
          </span>
        )}
      </div>
      
      {isExpanded && (
        <TagFilter
          tags={tags}
          selectedTags={selectedTags}
          onTagToggle={onTagToggle}
        />
      )}
    </div>
  )
}