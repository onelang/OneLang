use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub testMethod {
    my ( $self ) = @_;
    my $a = 1;
    my $b = 0;
    my $c = $a && $b;
    my $d = $a || $b;
    print(("a: @{[($a) ? 'true' : 'false']}, b: @{[($b) ? 'true' : 'false']}, c: @{[($c) ? 'true' : 'false']}, d: @{[($d) ? 'true' : 'false']}") . "\n");
}

package Program;
my $c = new TestClass();
$c->testMethod();