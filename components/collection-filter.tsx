"use client"

import { useState, useEffect } from 'react'
import { Button } from '../app/components/ui/button'
import { Badge } from '../app/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../app/components/ui/dropdown-menu'
import { ChevronDown, X } from 'lucide-react'

interface Collection {
  name: string
  code: string
  count: number
}

interface CollectionFilterProps {
  selectedCollection?: string
  onCollectionChange: (collectionCode?: string) => void
}

export function CollectionFilter({ selectedCollection, onCollectionChange }: CollectionFilterProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections')
        const data = await response.json()
        if (data.collections) {
          setCollections(data.collections)
        }
      } catch (error) {
        console.error('Error fetching collections:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  const selectedCollectionName = collections.find(c => c.code === selectedCollection)?.name

  if (loading) {
    return <div className="h-10 w-40 bg-gray-200 animate-pulse rounded" />
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[200px]">
            {selectedCollectionName || "Všechny kolekce"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-y-auto">
          <DropdownMenuItem
            onClick={() => onCollectionChange()}
            className="cursor-pointer"
          >
            <span className="font-medium">Všechny kolekce</span>
          </DropdownMenuItem>
          {collections.map((collection) => (
            <DropdownMenuItem
              key={collection.code}
              onClick={() => onCollectionChange(collection.code)}
              className="cursor-pointer flex items-center justify-between"
            >
              <span>{collection.name}</span>
              <Badge variant="secondary" className="text-xs">
                {collection.count}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {selectedCollection && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollectionChange()}
          className="p-1 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}