import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { skills } from '../lib/api';
import type { SkillPublic, SkillCategory } from '@skilldex/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { getCategoryBadgeVariant } from '@/lib/utils';

export default function Skills() {
  const [skillList, setSkillList] = useState<SkillPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<SkillCategory | 'all'>('all');

  useEffect(() => {
    skills
      .list()
      .then(setSkillList)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load skills');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(skillList.map((s) => s.category))],
    [skillList]
  );

  const filteredSkills = useMemo(
    () => filter === 'all'
      ? skillList.filter((s) => s.isEnabled)
      : skillList.filter((s) => s.isEnabled && s.category === filter),
    [skillList, filter]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Skills</h1>
        <p className="text-muted-foreground mt-1">
          Browse and download Claude Code skills for your recruiting workflow
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat as SkillCategory)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <Link key={skill.id} to={`/skills/${skill.slug}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{skill.name}</CardTitle>
                  <Badge variant={getCategoryBadgeVariant(skill.category)}>
                    {skill.category}
                  </Badge>
                </div>
                <CardDescription>{skill.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skill.requiredIntegrations.map((int) => (
                    <Badge key={int} variant="outline" className="text-xs">
                      {int}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No skills found for this category
        </div>
      )}
    </div>
  );
}
