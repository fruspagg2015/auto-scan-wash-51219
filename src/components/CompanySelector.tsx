import { useAuth, Company } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function CompanySelector() {
  const { user, switchCompany, currentCompanyId } = useAuth();

  if (!user || user.companies.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentCompanyId || user.companyId}
        onValueChange={switchCompany}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione a empresa" />
        </SelectTrigger>
        <SelectContent>
          {user.companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
