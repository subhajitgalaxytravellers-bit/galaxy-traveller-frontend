"use client";

import Link from 'next/link';
import Image from 'next/image';

const members = [
    {
        name: 'Liam Brown',
        role: 'Founder - CEO',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop',
        link: '#',
    },
    {
        name: 'Elijah Jones',
        role: 'Co-Founder - CTO',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop',
        link: '#',
    },
    {
        name: 'Isabella Garcia',
        role: 'Sales Manager',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
        link: '#',
    },
    {
        name: 'Henry Lee',
        role: 'UX Engineer',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop',
        link: '#',
    },
];

export default function TeamSection() {
    return (
        <section className="py-20 md:py-32 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className='text-center mb-16'>
                    <h2 className='text-4xl font-bold mb-4'>Meet Our Team</h2>
                    <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
                        The passionate individuals behind your extraordinary travel
                        experiences
                    </p>
                </div>
                
                <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                    {members.map((member, index) => (
                        <div key={index} className="group overflow-hidden rounded-xl bg-card border shadow-sm hover:shadow-lg transition-all duration-500">
                            <div className="relative h-96 w-full overflow-hidden">
                                <Image 
                                    className="object-cover object-top filter grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105" 
                                    src={member.avatar} 
                                    alt={member.name} 
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="text-xl font-bold transition-all duration-500 group-hover:text-primary">{member.name}</h3>
                                  
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-sm font-medium">{member.role}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
