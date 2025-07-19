import React from 'react';

import { AlbumListProps } from '@/types/Album';
import AlbumCard from './AlbumCard';

const AlbumList: React.FC<AlbumListProps> = ({
  albums,
  onAlbumClick,
  onEditAlbum,
  onDeleteAlbum,
}) => {
  return (
    // Responsive grid layout for album cards
    <div className="grid grid-cols-[repeat(auto-fill,_minmax(272px,_1fr))] gap-4">
      {albums.map((album) => (
        <AlbumCard
          key={album.id} // Unique key for each album
          album={album}
          onClick={() => onAlbumClick(album.id)} // Album view click
          onEdit={() => onEditAlbum(album.id)} // Edit action
          onDelete={() => onDeleteAlbum(album.id)} // Delete action
        />
      ))}
    </div>
  );
};

export default AlbumList;
