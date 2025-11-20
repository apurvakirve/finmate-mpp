import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../lib/supabase';

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    balance: string;
    metadata?: string;
}

export interface SignupFormData {
    name: string;
    email: string;
    password: string;
    age: string;
    phone: string;
    city: string;
    occupation: string;
    monthlyIncome: string;
    maritalStatus: string;
    dependents: string;
    primaryGoal: string;
    investmentExperience: string;
}

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (email: string, password: string) => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return false;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email.trim())
                .eq('password', password.trim())
                .single();

            if (error || !data) {
                Alert.alert('Error', 'Invalid email or password');
                return false;
            }

            setCurrentUser(data);
            Alert.alert('Success', `Welcome ${data.name}!`);
            return true;
        } catch (error) {
            Alert.alert('Error', 'Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (formData: SignupFormData) => {
        setLoading(true);
        try {
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('email', formData.email.trim())
                .maybeSingle();

            if (checkError) {
                console.error('Error checking email:', checkError);
                Alert.alert('Error', `Failed to check email: ${checkError.message}`);
                setLoading(false);
                return false;
            }

            if (existingUser) {
                Alert.alert('Error', 'Email already registered');
                setLoading(false);
                return false;
            }

            const userData: any = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password.trim(),
                role: 'user',
                balance: 0,
            };

            const metadata = {
                age: formData.age,
                phone: formData.phone,
                city: formData.city,
                occupation: formData.occupation,
                monthlyIncome: formData.monthlyIncome,
                maritalStatus: formData.maritalStatus,
                dependents: formData.dependents,
                primaryGoal: formData.primaryGoal,
                investmentExperience: formData.investmentExperience,
            };

            let insertResult = await supabase
                .from('users')
                .insert({
                    ...userData,
                    metadata: JSON.stringify(metadata),
                })
                .select('*')
                .single();

            if (insertResult.error && (insertResult.error.message?.includes('metadata') || insertResult.error.message?.includes('column'))) {
                console.log('Metadata column not found, inserting without metadata');
                insertResult = await supabase
                    .from('users')
                    .insert(userData)
                    .select('*')
                    .single();
            }

            if (insertResult.error) {
                console.error('Signup error:', insertResult.error);
                Alert.alert('Error', `Sign up failed: ${insertResult.error.message || 'Unknown error'}`);
                setLoading(false);
                return false;
            }

            if (!insertResult.data) {
                Alert.alert('Error', 'Sign up failed: No data returned');
                setLoading(false);
                return false;
            }

            const data = insertResult.data;
            setCurrentUser(data);
            Alert.alert('Success', `Welcome ${data.name}!`);
            return true;
        } catch (error: any) {
            console.error('Signup exception:', error);
            Alert.alert('Error', `Sign up failed: ${error?.message || 'Unknown error'}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        return true;
    };

    const refreshCurrentUser = async () => {
        if (currentUser) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (!error && data) {
                setCurrentUser(data);
                return data;
            }
        }
        return null;
    };

    return {
        currentUser,
        loading,
        handleLogin,
        handleSignup,
        handleLogout,
        refreshCurrentUser,
        setCurrentUser,
    };
};
