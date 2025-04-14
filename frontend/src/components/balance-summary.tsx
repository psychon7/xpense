import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";

interface Balance {
  amount: number;
  user: string;
}

interface BalanceSummaryProps {
  balances: {
    owed_to_me: Balance[];
    i_owe: Balance[];
    net_balance: number;
  };
}

export function BalanceSummary({ balances }: BalanceSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          <Icons.dollar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balances.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(balances.net_balance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {balances.net_balance >= 0 ? "You'll receive" : "You owe"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">They Owe You</CardTitle>
          <Icons.users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {balances.owed_to_me.map((balance) => (
              <div key={balance.user} className="flex items-center justify-between text-sm">
                <span>{balance.user}</span>
                <span className="font-medium text-green-600">
                  ${balance.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {balances.owed_to_me.length === 0 && (
              <p className="text-sm text-muted-foreground">No one owes you money</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Owe Them</CardTitle>
          <Icons.users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {balances.i_owe.map((balance) => (
              <div key={balance.user} className="flex items-center justify-between text-sm">
                <span>{balance.user}</span>
                <span className="font-medium text-red-600">
                  ${balance.amount.toFixed(2)}
                </span>
              </div>
            ))}
            {balances.i_owe.length === 0 && (
              <p className="text-sm text-muted-foreground">You don't owe anyone money at the moment</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
