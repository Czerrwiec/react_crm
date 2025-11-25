import { supabase } from '@/lib/supabase';
import { mapPackage } from '@/lib/mappers';
import type { Package } from '@/types';

export const packageService = {
    async getPackages() {
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .order('price');

        if (error) throw error;
        return data.map(mapPackage);
    },

    async createPackage(pkg: Omit<Package, 'id'>) {
        const { data, error } = await supabase
            .from('packages')
            .insert({
                name: pkg.name,
                price: pkg.price,
                hours: pkg.hours,
                description: pkg.description,
                includes_car: pkg.includesCar,
            })
            .select()
            .single();

        if (error) throw error;
        return mapPackage(data);
    },

    async updatePackage(id: string, updates: Partial<Package>) {
        const snakeCaseUpdates: any = {};

        if (updates.name !== undefined) snakeCaseUpdates.name = updates.name;
        if (updates.price !== undefined) snakeCaseUpdates.price = updates.price;
        if (updates.hours !== undefined) snakeCaseUpdates.hours = updates.hours;
        if (updates.description !== undefined) snakeCaseUpdates.description = updates.description;
        if (updates.includesCar !== undefined) snakeCaseUpdates.includes_car = updates.includesCar;

        const { data, error } = await supabase
            .from('packages')
            .update(snakeCaseUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapPackage(data);
    },

    async deletePackage(id: string) {
        const { error } = await supabase
            .from('packages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};