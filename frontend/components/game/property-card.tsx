import React from 'react';
import Image from 'next/image';
import { BoardSquare } from '@/types/game';

interface PropertyCardProps {
  square: BoardSquare;
  owner: string | null; // Address of the owner
  ownerUsername: string | null; // Username of the owner
  playerToken: string | null; // Token emoji (e.g., '🎩')
  isConnectedPlayer: boolean; // Whether the connected wallet owns the property
}

const PropertyCard = ({ square, owner, ownerUsername, playerToken, isConnectedPlayer }: PropertyCardProps) => {
  const { name, price, color, position, icon } = square;

  // Define classes for different orientations
  const orientationClasses = {
    bottom: 'border-t-8',
    left: 'border-t-8 rotate-90',
    top: 'border-b-8',
    right: 'border-t-8 -rotate-90',
  };

  const priceOrientationClasses = {
    bottom: 'bottom-0.5 right-0.5',
    left: 'bottom-[30%] -right-0.5 transform -rotate-90',
    top: 'bottom-0.5 right-0.5',
    right: 'transform rotate-90 bottom-[30%] -left-0.5',
  };

  const imageOrientationClasses = {
    bottom: '',
    left: '-rotate-90',
    top: '',
    right: 'rotate-90',
  };

  const ownerOrientationClasses = {
    bottom: 'top-0.5 left-0.5',
    left: 'top-[30%] -left-0.5 transform -rotate-90',
    top: 'top-0.5 left-0.5',
    right: 'transform rotate-90 top-[30%] -right-0.5',
  };

  return (
    <div
      className={`relative w-full h-full bg-[#F0F7F7] text-[#0B191A] p-1 flex flex-col justify-between rounded-[2.5px] ${
        orientationClasses[position]
      } ${owner ? 'border-2 border-green-500' : ''}`}
      style={{ borderColor: color }}
    >
      <div className="flex flex-col items-center">
        <p className="text-[5px] md:text-[5px] font-bold uppercase text-center">{name}</p>
        {icon && (
          <Image src={icon} alt={name} width={25} height={25} className={`my-1 transform ${imageOrientationClasses[position]}`} />
        )}
      </div>
      <p
        className={`text-[5px] md:text-[6px] absolute font-semibold bg-[#F0F7F7] shadow-sm p-0.5 rounded-[3px] ${
          priceOrientationClasses[position]
        }`}
      >
        ${price}
      </p>
      {owner && (
        <p
          className={`text-[4px] md:text-[5px] absolute font-medium bg-[#F0F7F7] shadow-sm p-0.5 rounded-[3px] ${
            ownerOrientationClasses[position]
          }`}
        >
          {ownerUsername || 'Unknown'} {isConnectedPlayer ? '(You)' : ''} {playerToken || ''}
        </p>
      )}
    </div>
  );
};

export default PropertyCard;